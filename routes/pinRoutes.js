const express = require("express");

const router = express.Router();


const auth = require("../middleware/auth");


const {

setPin,

verifyPin

} = require("../controllers/pinController");



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



module.exports = router;
