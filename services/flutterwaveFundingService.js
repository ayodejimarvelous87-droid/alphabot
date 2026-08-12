const mongoose = require("mongoose");

const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");

async function completeFlutterwaveFunding({
  txRef,
  flutterwaveId,
  flutterwaveReference,
  amount,
  phone,
  currency = "NGN"
}) {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      // Payment integrity
      if (!txRef || !flutterwaveId) {
        throw new Error("Missing Flutterwave transaction information");
      }

      if (currency !== "NGN") {
        throw new Error("Invalid payment currency");
      }

      const numericAmount = Number(amount);

      if (!numericAmount || numericAmount <= 0) {
        throw new Error("Invalid payment amount");
      }

      // Already completed by reference
      const alreadyCompleted = await Transaction.findOne({
        reference: txRef,
        type: "fund",
        status: "successful"
      }).session(session);

      if (alreadyCompleted) {
        result = {
          alreadyProcessed: true,
          transaction: alreadyCompleted
        };
        return;
      }

      // Already completed by Flutterwave ID
      const existingFlutterwave = await Transaction.findOne({
        flutterwaveId: String(flutterwaveId),
        type: "fund",
        status: "successful"
      }).session(session);

      if (existingFlutterwave) {
        result = {
          alreadyProcessed: true,
          transaction: existingFlutterwave
        };
        return;
      }

      // Find the original pending transaction.
      const pending = await Transaction.findOne({
        reference: txRef,
        type: "fund",
        status: "pending"
      }).session(session);

      if (!pending) {
        throw new Error("Pending Flutterwave funding transaction not found");
      }

      // Verify the payment belongs to the original request.
      if (Number(pending.amount) !== numericAmount) {
        throw new Error("Payment amount mismatch");
      }

      if (phone && pending.phone !== phone) {
        throw new Error("Payment owner mismatch");
      }

      // Claim the transaction atomically.
      const claimed = await Transaction.findOneAndUpdate(
        {
          _id: pending._id,
          status: "pending",
          walletCredited: { $ne: true }
        },
        {
          $set: {
            status: "processing"
          }
        },
        {
          new: true,
          session
        }
      );

      if (!claimed) {
        result = {
          alreadyProcessed: true
        };
        return;
      }

      // Atomically increment the wallet.
      const wallet = await Wallet.findOneAndUpdate(
        {
          phone: claimed.phone
        },
        {
          $inc: {
            balance: numericAmount
          }
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          session
        }
      );

      const balanceAfter = Number(wallet.balance);
      const balanceBefore = balanceAfter - numericAmount;

      // Update THE SAME transaction.
      const completed = await Transaction.findOneAndUpdate(
        {
          _id: claimed._id,
          status: "processing"
        },
        {
          $set: {
            status: "successful",
            walletCredited: true,
            flutterwaveId: String(flutterwaveId),
            flutterwaveReference: flutterwaveReference || null,
            balanceBefore,
            balanceAfter,
            description: "Flutterwave wallet funding"
          }
        },
        {
          new: true,
          session
        }
      );

      if (!completed) {
        throw new Error("Unable to complete funding transaction");
      }

      result = {
        alreadyProcessed: false,
        transaction: completed,
        wallet
      };
    });

    return result;

  } finally {
    await session.endSession();
  }
}

module.exports = {
  completeFlutterwaveFunding
};
