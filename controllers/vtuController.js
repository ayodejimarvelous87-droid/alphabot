const wallets = require("../models/wallet");
const transactions = require("../models/Transaction");

const buyData = (req, res) => {
  const { phone, network, plan, amount } = req.body;

  const wallet = wallets.find((w) => w.phone === phone);

  if (!wallet) {
    return res.json({
      message: "Wallet not found"
    });
  }

  if (wallet.balance < Number(amount)) {
    return res.json({
      message: "Insufficient balance",
      balance: wallet.balance
    });
  }

  wallet.balance -= Number(amount);

  const transaction = {
    id: transactions.length + 1,
    phone,
    network,
    plan,
    amount,
    status: "successful",
    date: new Date()
  };

  transactions.push(transaction);

  res.json({
    message: "Data purchase successful",
    transaction,
    newBalance: wallet.balance
  });
};

module.exports = {
  buyData
};