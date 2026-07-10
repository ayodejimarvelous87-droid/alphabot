const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  fundWallet,
  checkBalance,
  transactionHistory,
  payWallet
} = require("../controllers/walletController");


router.post("/fund", auth, fundWallet);

router.get("/balance/:phone", auth, checkBalance);

router.get("/transactions/:phone", auth, transactionHistory);

router.post("/pay", auth, payWallet);


module.exports = router;
