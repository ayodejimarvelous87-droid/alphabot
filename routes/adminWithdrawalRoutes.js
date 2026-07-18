const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require("../controllers/adminWithdrawalController");


// Get withdrawals
router.get(
  "/withdrawals",
  auth,
  admin,
  getWithdrawals
);


router.post(
  "/approve/:id",
  auth,
  admin,
  approveWithdrawal
);


router.post(
  "/reject/:id",
  auth,
  admin,
  rejectWithdrawal
);


module.exports = router;
