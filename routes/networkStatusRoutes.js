const express = require("express");

const router = express.Router();

const {
  getNetworkStatus
} = require("../controllers/networkStatusController");

router.get(
  "/",
  getNetworkStatus
);

module.exports = router;
