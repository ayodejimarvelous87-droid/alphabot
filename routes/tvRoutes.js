const express = require("express");

const router = express.Router();


const auth = require("../middleware/auth");


const {
    subscribeTV
} = require("../controllers/tvController");



// TV Subscription

router.post(
    "/subscribe",
    auth,
    subscribeTV
);



module.exports = router;
