const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { purchaseLimiter } = require("../middleware/rateLimiter");

const {
fundBetting
} = require("../controllers/bettingController");



router.post(
"/fund",
auth,
purchaseLimiter,
fundBetting
);



module.exports = router;
