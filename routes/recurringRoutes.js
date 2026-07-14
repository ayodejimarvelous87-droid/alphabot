const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
createRecurring,
getRecurring,
cancelRecurring
} = require("../controllers/recurringController");


// Create recurring payment
router.post("/", auth, createRecurring);


// Get user recurring payments
router.get("/:phone", auth, getRecurring);


// Cancel recurring payment
router.delete("/:id", auth, cancelRecurring);


module.exports = router;
