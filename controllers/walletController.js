const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");


// Fund wallet
const fundWallet = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    if (req.user.phone !== phone) {
      return res.status(403).json({
        message: "Unauthorized wallet access"
      });
    }

    let wallet = await Wallet.findOne({ phone });

    if (!wallet) {
      wallet = await Wallet.create({
        phone,
        balance: Number(amount)
      });
    } else {
      wallet.balance += Number(amount);
      await wallet.save();
    }

    await Transaction.create({
      phone,
      type: "fund",
      amount: Number(amount),
      description: "Wallet funding"
    });

    res.json({
      message: "Wallet funded successfully",
      wallet
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// Check wallet balance
const checkBalance = async (req, res) => {
  try {
    const { phone } = req.params;

    if (req.user.phone !== phone) {
      return res.status(403).json({
        message: "Unauthorized wallet access"
      });
    }

    const wallet = await Wallet.findOne({ phone });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    res.json(wallet);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// Transaction history
const transactionHistory = async (req, res) => {
  try {
    const { phone } = req.params;

    if (req.user.phone !== phone) {
      return res.status(403).json({
        message: "Unauthorized wallet access"
      });
    }

    const transactions = await Transaction.find({ phone })
      .sort({ createdAt: -1 });

    res.json(transactions);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// Pay using wallet
const payWallet = async (req, res) => {
  try {
    const { phone, amount, description } = req.body;

    if (req.user.phone !== phone) {
      return res.status(403).json({
        message: "Unauthorized wallet access"
      });
    }

    const wallet = await Wallet.findOne({ phone });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    if (wallet.balance < Number(amount)) {
      return res.status(400).json({
        message: "Insufficient wallet balance"
      });
    }

    wallet.balance -= Number(amount);

    await wallet.save();

    await Transaction.create({
      phone,
      type: "purchase",
      amount: Number(amount),
      description: description || "VTU purchase"
    });

    res.json({
      message: "Payment successful",
      wallet
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


module.exports = {
  fundWallet,
  checkBalance,
  transactionHistory,
  payWallet
};
