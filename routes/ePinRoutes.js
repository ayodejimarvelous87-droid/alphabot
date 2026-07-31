const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { purchaseLimiter } = require("../middleware/rateLimiter");

const {
buyEPin
} = require("../controllers/ePinController");


router.post(
"/buy",
auth,
purchaseLimiter,
buyEPin
);


module.exports = router;
