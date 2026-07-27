const cron = require("node-cron");
const Flutterwave = require("flutterwave-node-v3");

const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

function startFlutterwaveCron() {

  cron.schedule("*/2 * * * *", async () => {

    try {

      console.log("🔄 Checking pending Flutterwave payments...");

      const pending = await Transaction.find({
        type: "fund_request",
        status: "pending"
      });

      for (const payment of pending) {

        try {

          const verify = await flw.Transaction.verify({
            id: payment.flutterwaveId
          });

          if (
            verify.status !== "success" ||
            verify.data.status !== "successful"
          ) {
            continue;
          }

          const alreadyCredited = await Transaction.findOne({
            reference: payment.reference,
            type: "fund"
          });

          if (alreadyCredited) {

            payment.status = "completed";
            await payment.save();

            continue;
          }

          let wallet = await Wallet.findOne({
            phone: payment.phone
          });

          if (!wallet) {

            wallet = await Wallet.create({
              phone: payment.phone,
              balance: 0
            });

          }

          const balanceBefore = wallet.balance;

          wallet.balance += Number(verify.data.amount);

          await wallet.save();

          await Transaction.create({

            phone: payment.phone,

            type: "fund",

            direction: "credit",

            amount: Number(verify.data.amount),

            reference: payment.reference,

            flutterwaveId: verify.data.id,

            flutterwaveReference: verify.data.flw_ref,

            balanceBefore,

            balanceAfter: wallet.balance,

            description: "Flutterwave Cron Funding",

            status: "successful"

          });

          payment.status = "completed";

          await payment.save();

          console.log(
            `✅ Credited ${payment.phone} - ${payment.reference}`
          );

        } catch (err) {

          console.log(
            "Cron Verify Error:",
            err.message
          );

        }

      }

    } catch (err) {

      console.log(
        "Flutterwave Cron Error:",
        err.message
      );

    }

  });

}

module.exports = {
  startFlutterwaveCron
};
