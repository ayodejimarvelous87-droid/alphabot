const express = require("express");
const router = express.Router();

const transactions = require("../models/Transaction");

router.get("/:phone", (req, res) => {
  const { phone } = req.params;

  const userTransactions = transactions.filter(
    (transaction) => transaction.phone === phone
  );

  res.json({
    transactions: userTransactions
  });
});

module.exports = router;