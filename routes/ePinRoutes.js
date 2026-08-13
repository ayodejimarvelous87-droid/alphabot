const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { purchaseLimiter } = require("../middleware/rateLimiter");

const {
buyEPin,
getEPinStatus
} = require("../controllers/ePinController");


router.post(
"/buy",
auth,
purchaseLimiter,
buyEPin
);

router.get(
"/status/:reference",
auth,
getEPinStatus
);


module.exports = router;
