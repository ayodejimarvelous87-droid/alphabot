const express = require("express");

const router = express.Router();


const auth = require("../middleware/auth");
const { purchaseLimiter } = require("../middleware/rateLimiter");


const {
    payElectricity
} = require("../controllers/electricityController");



// Electricity payment

router.post(
    "/pay",
    auth,
    purchaseLimiter,
    payElectricity
);



module.exports = router;
