const express = require("express");

const router = express.Router();


const auth = require("../middleware/auth");


const {
    payElectricity
} = require("../controllers/electricityController");



// Electricity payment

router.post(
    "/pay",
    auth,
    payElectricity
);



module.exports = router;
