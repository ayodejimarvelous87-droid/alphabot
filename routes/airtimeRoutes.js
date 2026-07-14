const express = require("express");

const router = express.Router();


const auth = require("../middleware/auth");


const {
    buyAirtime
} = require("../controllers/airtimeController");



// Buy airtime

router.post(
    "/buy",
    auth,
    buyAirtime
);



module.exports = router;
