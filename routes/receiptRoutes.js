const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
getReceipt
} = require("../controllers/receiptController");


router.get("/:id", auth, getReceipt);


module.exports = router;
