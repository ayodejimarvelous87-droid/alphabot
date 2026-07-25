const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


const {
getAllRecurring,
cancelRecurringAdmin
} = require("../controllers/adminRecurringController");



// Get all recurring payments
router.get(
"/",
auth,
admin,
getAllRecurring
);


// Cancel recurring payment
router.put(
"/cancel/:id",
auth,
admin,
cancelRecurringAdmin
);


module.exports = router;
