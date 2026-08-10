const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  biometricStatus,
  biometricLoginOptions,
  biometricLoginVerify,
  registerOptions,
  registerVerify,
  authenticationOptions,
  authenticationVerify,
  removeBiometric
} = require("../controllers/biometricController");


router.post(
  "/login/options",
  biometricLoginOptions
);


router.post(
  "/login/verify",
  biometricLoginVerify
);


router.get(
  "/status",
  auth,
  biometricStatus
);


router.get(
  "/register/options",
  auth,
  registerOptions
);


router.post(
  "/register/verify",
  auth,
  registerVerify
);


router.get(
  "/authenticate/options",
  auth,
  authenticationOptions
);


router.post(
  "/authenticate/verify",
  auth,
  authenticationVerify
);


router.delete(
  "/",
  auth,
  removeBiometric
);


module.exports = router;
