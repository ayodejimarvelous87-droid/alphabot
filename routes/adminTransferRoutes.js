const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
getTransferSettings,
updateTransferSettings
} = require("../controllers/adminTransferController");


// Get transfer settings
router.get(
"/",
auth,
getTransferSettings
);


// Update transfer settings
router.put(
"/",
auth,
updateTransferSettings
);


module.exports = router;
