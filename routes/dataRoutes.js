const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { purchaseLimiter } = require("../middleware/rateLimiter");

const {
buyData
} = require("../controllers/dataController");


// Buy data

router.post(
"/buy",
auth,
purchaseLimiter,
buyData
);


module.exports = router;
