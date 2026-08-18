const mongoose = require("mongoose");
const Flutterwave = require("flutterwave-node-v3");

const User = require("../models/User");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

async function processPermanentVirtualAccountFunding({
  flutterwaveId,
  txRef,
  amount,
  currency,
  accountNumber
}) {

  if (!flutterwaveId) {
    throw new Error("Missing Flutterwave transaction ID");
  }

  const session = await mongoose.startSession();

  try {

    let result;

    await session.withTransaction(async () => {

      const existing = await Transaction.findOne({
        flutterwaveId: String(flutterwaveId),
        type: "fund",
        status: "successful"
      }).session(session);

      if (existing) {
        result = {
          alreadyProcessed: true,
          transaction: existing
        };
        return;
      }

      const verified = await flw.Transaction.verify({
        id: flutterwaveId
      });

      if (
        verified.status !== "success" ||
        verified.data?.status !== "successful"
      ) {
        throw new Error(
          "Flutterwave transaction verification failed"
        );
      }

      const payment = verified.data;

      if (payment.currency !== "NGN") {
        throw new Error("Invalid payment currency");
      }

      const numericAmount = Number(payment.amount);

      if (!numericAmount || numericAmount <= 0) {
        throw new Error("Invalid funding amount");
      }

      if (
        amount !== undefined &&
        Number(amount) !== numericAmount
      ) {
        throw new Error("Payment amount mismatch");
      }

      const reference =
        payment.tx_ref ||
        txRef ||
        null;

      const destinationAccount =
        accountNumber ||
        payment.account_number ||
        payment.accountNumber ||
        payment.payment_account_number ||
        payment.bank_transfer?.account_number ||
        null;

      /*
       * Permanent virtual accounts are identified by the
       * actual account number assigned to the user.
       *
       * We do NOT rely on tx_ref alone because a permanent
       * account can receive multiple deposits.
       */
      if (!destinationAccount) {
        throw new Error(
          "Permanent virtual account number not found"
        );
      }

      const user = await User.findOne({
        virtualAccountNumber: String(destinationAccount),
        virtualAccountStatus: "active"
      }).session(session);

      if (!user) {
        throw new Error(
          "Permanent virtual account owner not found"
        );
      }

      /*
       * If Flutterwave supplies a transaction reference,
       * accept the user's stored PVA reference or the
       * provider's actual reference.
       *
       * The account number remains the ownership check.
       */
      if (
        reference &&
        user.virtualAccountReference &&
        reference !== user.virtualAccountReference
      ) {
        console.log(
          "PVA reference differs from account reference:",
          {
            accountNumber: String(destinationAccount),
            storedReference: user.virtualAccountReference,
            paymentReference: reference
          }
        );
      }

      const wallet =
        await Wallet.findOneAndUpdate(
          {
            phone: user.phone
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

      const balanceAfter =
        Number(wallet.balance);

      const balanceBefore =
        balanceAfter - numericAmount;

      const transactionReference =
        `PVA-${String(flutterwaveId)}`;

      const transaction =
        await Transaction.create(
          [{
            phone: user.phone,

            type: "fund",

            direction: "credit",

            amount: numericAmount,

            reference:
              transactionReference,

            flutterwaveId:
              String(flutterwaveId),

            flutterwaveReference:
              payment.flw_ref || null,

            walletCredited: true,

            balanceBefore,

            balanceAfter,

            description:
              "Permanent virtual account funding",

            status: "successful"
          }],
          { session }
        );

      result = {
        alreadyProcessed: false,

        user,

        wallet,

        transaction:
          transaction[0]
      };

    });

    return result;

  } finally {
    await session.endSession();
  }
}

module.exports = {
  processPermanentVirtualAccountFunding
};
