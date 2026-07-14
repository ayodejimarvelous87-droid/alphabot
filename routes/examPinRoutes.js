const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
buyExamPin
} = require("../controllers/examPinController");


// Buy Exam PIN
router.post("/", auth, buyExamPin);


module.exports = router;
