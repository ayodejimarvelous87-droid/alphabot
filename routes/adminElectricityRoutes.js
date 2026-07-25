const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


const {
getElectricitySettings,
updateElectricitySetting
} = require("../controllers/adminElectricityController");



// Get all electricity settings
router.get(
"/",
auth,
admin,
getElectricitySettings
);


// Update disco setting
router.put(
"/:disco",
auth,
admin,
updateElectricitySetting
);


module.exports = router;
