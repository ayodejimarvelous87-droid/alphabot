const express = require("express");

const router = express.Router();

const {
getTransferPublicSettings
} = require("../controllers/transferSettingsController");


router.get(
"/",
getTransferPublicSettings
);


module.exports = router;
