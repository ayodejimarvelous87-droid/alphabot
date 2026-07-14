require("dotenv").config();

const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");

const paymentWebhook = async (req, res) => {
  try {

    const secret = req.headers["x-payment-secret"];

    if (secret !== process.env.PAYMENT_SECRET) {
      return res.status(401).json({
        message: "Invalid payment secret"
      });
    }

    const { phone, amount, reference } = req.body;

    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || !amount || !reference) {
      return res.status(400).json({
        message: "Invalid payment data"
      });
    }

    const existingTransaction = await Transaction.findOne({
      description: `Wallet funding - ${reference}`
    });

    if (existingTransaction) {
      return res.status(400).json({
        message: "Payment already processed"
      });
    }

    const wallet = await Wallet.findOne({
      phone: cleanPhone
    });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    wallet.balance += Number(amount);

    await wallet.save();

    await Transaction.create({
      phone: cleanPhone,
      type: "fund",
      amount: Number(amount),
      description: `Wallet funding - ${reference}`,
      status: "successful"
    });

    await createNotification(
      cleanPhone,
      "Wallet Funded",
      `₦${Number(amount).toLocaleString()} has been added to your wallet successfully.`,
      "success"
    );

    res.json({
      message: "Wallet funded successfully",
      balance: wallet.balance
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message
    });

  }
};

module.exports = {
  paymentWebhook
};
