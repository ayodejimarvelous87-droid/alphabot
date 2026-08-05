const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { purchaseLimiter } = require("../middleware/rateLimiter");

const {
fundBetting,
getAvailableBettingServices
} = require("../controllers/bettingController");



router.get(
"/services",
getAvailableBettingServices
);


router.post(
"/fund",
auth,
purchaseLimiter,
fundBetting
);



module.exports = router;
