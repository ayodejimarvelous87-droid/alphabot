const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { purchaseLimiter } = require("../middleware/rateLimiter");

const {
buyExamPin
} = require("../controllers/examPinController");


// Buy Exam PIN
router.post("/", auth, purchaseLimiter, buyExamPin);


module.exports = router;
