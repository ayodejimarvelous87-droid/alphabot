const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
withdraw,
getWithdrawals
} = require("../controllers/withdrawalController");


// Automatic wallet withdrawal
router.post("/", auth, withdraw);


// Withdrawal history
router.get("/:phone", auth, getWithdrawals);


module.exports = router;
