const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
requestAirtimeCash,
getAirtimeCash
} = require("../controllers/airtimeCashController");


// Submit airtime to cash request
router.post("/", auth, requestAirtimeCash);


// Get user requests
router.get("/:phone", auth, getAirtimeCash);


module.exports = router;
