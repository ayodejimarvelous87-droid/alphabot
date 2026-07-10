const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  getTransactions
} = require("../controllers/transactionController");


// Transaction history
router.get("/:phone", auth, getTransactions);


module.exports = router;
