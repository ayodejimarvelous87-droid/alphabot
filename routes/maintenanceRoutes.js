const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
    getMaintenance,
    updateMaintenance
} = require("../controllers/maintenanceController");


// Public - check maintenance status
router.get("/", getMaintenance);


// Admin - update settings
router.put("/", auth, admin, updateMaintenance);


module.exports = router;
