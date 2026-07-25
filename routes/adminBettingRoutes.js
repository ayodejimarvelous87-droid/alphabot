const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


const {
getBettingSettings,
updateBettingSetting
} = require("../controllers/adminBettingController");



// Get betting settings
router.get(
"/",
auth,
admin,
getBettingSettings
);


// Update betting provider setting
router.put(
"/:service",
auth,
admin,
updateBettingSetting
);


module.exports = router;
