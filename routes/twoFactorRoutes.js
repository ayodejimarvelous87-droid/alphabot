const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  getTwoFactorStatus,
  setupTwoFactor,
  verifyTwoFactorSetup,
  verifyTwoFactor,
  disableTwoFactor
} = require("../controllers/twoFactorController");

router.get("/status", auth, getTwoFactorStatus);

router.post("/setup", auth, setupTwoFactor);

router.post("/verify-setup", auth, verifyTwoFactorSetup);

router.post("/verify", auth, verifyTwoFactor);

router.post("/disable", auth, disableTwoFactor);

module.exports = router;
