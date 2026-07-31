const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
getTransferSettings,
updateTransferSettings
} = require("../controllers/adminTransferController");


// Get transfer settings
router.get(
"/",
auth,
admin,
getTransferSettings
);


// Update transfer settings
router.put(
"/",
auth,
admin,
updateTransferSettings
);


module.exports = router;
