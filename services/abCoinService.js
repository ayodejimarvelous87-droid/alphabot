const mongoose = require("mongoose");

const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/wallet");
const SystemSetting = require("../models/SystemSetting");
const ABCoinTransaction = require("../models/ABCoinTransaction");


/**
 * Award AB Coins for a successful purchase.
 *
 * Rules are controlled by SystemSetting:
 *
 * abCoinsPer100Naira = 0.2
 *
 * Therefore:
 * ₦100  = 0.2 coins
 * ₦250  = 0.5 coins
 * ₦500  = 1 coin
 * ₦1000 = 2 coins
 *
 * The transactionId is unique in ABCoinTransaction,
 * preventing the same purchase from receiving coins twice.
 */
async function awardPurchaseCoins(transactionOrId) {

  let transaction;

  if (
    transactionOrId &&
    typeof transactionOrId === "object" &&
    transactionOrId._id
  ) {
    transaction = transactionOrId;
  } else {
    transaction = await Transaction.findById(transactionOrId);
  }


  if (!transaction) {
    throw new Error("Transaction not found");
  }


  // Only successful transactions can earn AB Coins.
  if (transaction.status !== "successful") {
    return {
      awarded: false,
      reason: "transaction_not_successful",
      coins: 0
    };
  }


  // Only actual purchase/service transactions earn AB Coins.
  const eligiblePurchaseTypes = new Set([
    "purchase",
    "airtime",
    "data",
    "betting",
    "electricity",
    "tv",
    "exam_pin",
    "recharge_pin"
  ]);


  if (!eligiblePurchaseTypes.has(transaction.type)) {
    return {
      awarded: false,
      reason: "not_a_purchase",
      coins: 0
    };
  }


  if (transaction.direction !== "debit") {
    return {
      awarded: false,
      reason: "not_a_debit",
      coins: 0
    };
  }


  if (!transaction.phone) {
    throw new Error("Transaction has no phone number");
  }


  const amount = Number(transaction.amount);


  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      awarded: false,
      reason: "invalid_purchase_amount",
      coins: 0
    };
  }


  /*
   * Load the editable AB Coin rate before starting
   * the balance transaction.
   */
  const settings = await SystemSetting.findOne()
    .sort({ createdAt: 1 })
    .lean();


  const rate = Number(settings?.abCoinsPer100Naira ?? 0.2);


  if (!Number.isFinite(rate) || rate <= 0) {
    return {
      awarded: false,
      reason: "coins_disabled",
      coins: 0
    };
  }


  /*
   * Example:
   *
   * ₦500 × 0.2 / 100 = 1 AB Coin
   */
  const coins = Math.round(
    (amount * rate / 100) * 100
  ) / 100;


  if (coins <= 0) {
    return {
      awarded: false,
      reason: "zero_coin_reward",
      coins: 0
    };
  }


  /*
   * IMPORTANT:
   *
   * The reward record and the user's AB Coin balance
   * are updated inside ONE MongoDB transaction.
   *
   * If either operation fails, MongoDB rolls both back.
   */
  const session = await mongoose.startSession();


  try {

    let result;


    try {

      await session.withTransaction(async () => {

        /*
         * Idempotency check happens inside the transaction.
         *
         * The unique transactionId index remains the final
         * protection against concurrent duplicate rewards.
         */
        const existing =
          await ABCoinTransaction.findOne({
            transactionId: transaction._id
          }).session(session);


        if (existing) {

          result = {
            awarded: false,
            reason: "already_awarded",
            coins: existing.coins,
            balance: existing.balanceAfter
          };

          return;
        }


        /*
         * Read the current user balance INSIDE the transaction.
         */
        const user = await User.findOne({
          phone: transaction.phone
        }).session(session);


        if (!user) {
          throw new Error(
            `User not found for phone ${transaction.phone}`
          );
        }


        const balanceBefore =
          Number(user.abCoins || 0);


        const balanceAfter =
          Math.round(
            (balanceBefore + coins) * 100
          ) / 100;


        /*
         * Create the immutable reward history record.
         */
        await ABCoinTransaction.create(
          [{
            phone: transaction.phone,

            type: "purchase_reward",

            coins,

            balanceBefore,

            balanceAfter,

            transactionId: transaction._id,

            purchaseAmount: amount,

            description:
              `AB Coins reward for ₦${amount.toLocaleString()} purchase`,

            reference:
              `ABC-${transaction._id}-${Date.now()}`
          }],
          {
            session
          }
        );


        /*
         * Update the actual user balance in the SAME transaction.
         */
        const updatedUser =
          await User.findOneAndUpdate(
            {
              phone: transaction.phone
            },
            {
              $inc: {
                abCoins: coins
              }
            },
            {
              new: true,
              session
            }
          );


        if (!updatedUser) {
          throw new Error(
            `Failed to update AB Coins for ${transaction.phone}`
          );
        }


        result = {
          awarded: true,

          coins,

          balance:
            Number(updatedUser.abCoins || 0),

          purchaseAmount: amount,

          transactionId: transaction._id
        };

      });

    } catch (error) {

      /*
       * Concurrent duplicate reward:
       *
       * Another request may have inserted the same
       * transactionId first. MongoDB rejects this insert
       * because transactionId is uniquely indexed.
       *
       * The failed transaction has already been aborted,
       * so we deliberately query WITHOUT the old session.
       */
      if (error && error.code === 11000) {

        const existing =
          await ABCoinTransaction.findOne({
            transactionId: transaction._id
          });

        if (existing) {

          return {
            awarded: false,
            reason: "already_awarded",
            coins: existing.coins,
            balance: existing.balanceAfter
          };

        }

      }

      throw error;
    }


    return result;


  } catch (error) {

    /*
     * AB Coin rewards must NEVER make a successful purchase
     * appear to have failed.
     *
     * The purchase transaction has already been completed
     * before this service is called. If the reward subsystem
     * fails, simply log the error and return a non-fatal result.
     *
     * A later retry can safely award the coins because
     * transactionId is protected by a unique sparse index.
     */
    console.error(
      "AB COIN REWARD ERROR:",
      error?.message || error
    );

    return {
      awarded: false,
      reason: "reward_failed",
      coins: 0,
      transactionId: transaction._id
    };

  } finally {

    await session.endSession();

  }
}


/**
 * Redeem AB Coins into wallet balance.
 *
 * Default:
 * 1,000 AB Coins = ₦200
 */
async function redeemABCoins(phone, idempotencyKey) {

  if (!phone) {
    throw new Error("Phone number is required");
  }

  if (!idempotencyKey) {
    throw new Error("Idempotency key is required");
  }

  const settings = await SystemSetting.findOne()
    .sort({ createdAt: 1 })
    .lean();

  const coinTarget = Number(
    settings?.abCoinsRedemptionTarget ?? 1000
  );

  const walletReward = Number(
    settings?.abCoinsRedemptionReward ?? 200
  );

  if (
    !Number.isFinite(coinTarget) ||
    coinTarget <= 0 ||
    !Number.isFinite(walletReward) ||
    walletReward <= 0
  ) {
    throw new Error("AB Coin redemption is disabled");
  }

  const reference =
    `ABR-${phone}-${String(idempotencyKey)}`;

  const session = await mongoose.startSession();

  try {

    let result;

    await session.withTransaction(async () => {

      const existing =
        await ABCoinTransaction.findOne({
          reference
        }).session(session);

      if (existing) {
        result = {
          redeemed: false,
          reason: "already_redeemed",
          coins: Math.abs(existing.coins),
          reward: existing.purchaseAmount,
          balance: existing.balanceAfter
        };

        return;
      }

      const user =
        await User.findOneAndUpdate(
          {
            phone,
            abCoins: {
              $gte: coinTarget
            }
          },
          {
            $inc: {
              abCoins: -coinTarget
            }
          },
          {
            new: true,
            session
          }
        );

      if (!user) {
        throw new Error("Insufficient AB Coins");
      }

      const walletBefore =
        await Wallet.findOne({
          phone
        }).session(session);

      if (!walletBefore) {
        throw new Error("Wallet not found");
      }

      const walletBalanceBefore =
        Number(walletBefore.balance || 0);

      const wallet =
        await Wallet.findOneAndUpdate(
          { phone },
          {
            $inc: {
              balance: walletReward
            }
          },
          {
            new: true,
            session
          }
        );

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const walletTransaction =
        await Transaction.create(
          [{
            phone,
            type: "ab_coin_redemption",
            direction: "credit",
            amount: walletReward,
            balanceBefore: walletBalanceBefore,
            balanceAfter: wallet.balance,
            walletCredited: true,
            description:
              `AB Coins redemption: ${coinTarget} coins -> ₦${walletReward}`,
            reference,
            status: "successful"
          }],
          { session }
        );

      const balanceAfterCoins =
        Number(user.abCoins || 0);

      await ABCoinTransaction.create(
        [{
          phone,
          type: "redemption",
          coins: -coinTarget,
          balanceBefore:
            balanceAfterCoins + coinTarget,
          balanceAfter:
            balanceAfterCoins,
          transactionId:
            walletTransaction[0]._id,
          purchaseAmount:
            walletReward,
          description:
            `Redeemed ${coinTarget} AB Coins for ₦${walletReward}`,
          reference
        }],
        { session }
      );

      result = {
        redeemed: true,
        coinsRedeemed: coinTarget,
        walletCredit: walletReward,
        abCoinsBalance: balanceAfterCoins,
        walletBalance: Number(wallet.balance)
      };
    });

    return result;

  } finally {
    await session.endSession();
  }
}


module.exports = {
  awardPurchaseCoins,
  redeemABCoins
};
