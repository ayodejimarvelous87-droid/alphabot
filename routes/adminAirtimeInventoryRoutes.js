const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
getAirtimeInventory,
updateAirtimeInventoryLimit
} = require("../controllers/adminAirtimeInventoryController");


// Get airtime inventory
router.get(
"/",
auth,
admin,
getAirtimeInventory
);


// Update network limit
router.put(
"/:network",
auth,
admin,
updateAirtimeInventoryLimit
);


module.exports = router;
