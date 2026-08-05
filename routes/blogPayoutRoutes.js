const express = require("express");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  markBlogPaid,
  getPendingPayouts,
  getPayoutHistory
}=require("../controllers/blogPayoutController");


const router = express.Router();


// view pending partner payouts
router.get(
"/pending",
auth,
admin,
getPendingPayouts
);


// payout history
router.get(
"/history",
auth,
admin,
getPayoutHistory
);


// admin marks partner payout completed
router.put(
"/pay/:id",
auth,
admin,
markBlogPaid
);


module.exports = router;
