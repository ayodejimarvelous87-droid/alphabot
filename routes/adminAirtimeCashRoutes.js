const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
getAirtimeCashRequests,
approveAirtimeCash
} = require("../controllers/adminAirtimeCashController");


// Get pending requests
router.get("/", auth, admin, getAirtimeCashRequests);


// Approve request
router.post("/approve/:id", auth, admin, approveAirtimeCash);


module.exports = router;
