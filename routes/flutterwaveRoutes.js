const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  createPayment,
  verifyPayment,
  flutterwaveWebhook
} = require("../controllers/flutterwaveController");


// Create payment
router.post(
  "/pay",
  auth,
  createPayment
);


// Verify payment manually
router.get(
  "/verify/:transaction_id",
  auth,
  verifyPayment
);


// Flutterwave webhook
// No auth middleware here
router.post(
  "/webhook",
  flutterwaveWebhook
);


module.exports = router;
