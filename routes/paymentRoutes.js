const express = require("express");
const router = express.Router();

const {
  paymentWebhook
} = require("../controllers/paymentController");


// Payment provider webhook
router.post("/webhook", paymentWebhook);


module.exports = router;
