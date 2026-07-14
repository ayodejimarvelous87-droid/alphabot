const express = require("express");

const router = express.Router();


const auth = require("../middleware/auth");


const {
    fundBetting
} = require("../controllers/bettingController");



// Fund betting account

router.post(
    "/fund",
    auth,
    fundBetting
);



module.exports = router;
