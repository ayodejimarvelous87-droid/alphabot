const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { otpLimiter } = require("../middleware/rateLimiter");

const {
  requestAirtimeCash,
  getAirtimeCash,
  generateAirtimeOTP,
  verifyAirtimeOTP,
  convertAirtime
} = require("../controllers/airtimeCashController");


// Legacy airtime cash request


// A2C automated flow
router.post("/generate-otp", auth, otpLimiter, generateAirtimeOTP);

router.post("/verify-otp", auth, otpLimiter, verifyAirtimeOTP);

router.post("/convert", auth, convertAirtime);


// History
router.get("/:phone", auth, getAirtimeCash);


module.exports = router;
