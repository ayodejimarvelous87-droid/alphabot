const express = require("express");

const router = express.Router();


const auth = require("../middleware/auth");


const {

sendPinOTP,
checkPinStatus,
setPin,

verifyPin

} = require("../controllers/pinController");

// Send Transaction PIN OTP
router.post(
"/send-pin-otp",
auth,
sendPinOTP
);



// Create / Change PIN

router.post(
"/set",
auth,
setPin
);



// Verify PIN before payment

router.post(
"/verify",
auth,
verifyPin
);




// Check Transaction PIN status
router.get(
"/status",
auth,
checkPinStatus
);

module.exports = router;
