const express = require("express");

const router = express.Router();


const auth = require("../middleware/auth");
const { purchaseLimiter } = require("../middleware/rateLimiter");


const {
    buyAirtime
} = require("../controllers/airtimeController");



// Buy airtime

router.post(
    "/buy",
    auth,
    purchaseLimiter,
    buyAirtime
);



module.exports = router;
