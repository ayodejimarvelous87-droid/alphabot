const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  getBanks,
  verifyAccount
} = require("../controllers/bankController");

router.get(
  "/",
  auth,
  getBanks
);

router.post(
  "/verify",
  auth,
  verifyAccount
);

module.exports = router;
