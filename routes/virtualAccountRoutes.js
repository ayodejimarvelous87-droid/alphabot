const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  createVirtualAccount,
  getVirtualAccount
} = require("../controllers/virtualAccountController");


router.post(
  "/create",
  auth,
  createVirtualAccount
);


router.get(
  "/",
  auth,
  getVirtualAccount
);


module.exports = router;
