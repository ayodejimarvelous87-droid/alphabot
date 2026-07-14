const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const maintenance = require("../middleware/maintenance");


const {
  fundWallet,
  checkBalance,
  transactionHistory,
  payWallet
} = require("../controllers/walletController");


// Customer wallet actions (blocked during maintenance)

router.post(
  "/fund",
  auth,
  maintenance,
  fundWallet
);


router.get(
  "/balance/:phone",
  auth,
  checkBalance
);


router.get(
  "/transactions/:phone",
  auth,
  transactionHistory
);


router.post(
  "/pay",
  auth,
  maintenance,
  payWallet
);


module.exports = router;
