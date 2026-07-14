const express = require("express");
const router = express.Router();

const {
  getBankDetails,
  updateBankDetails
} = require("../controllers/bankController");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


// Customer views bank details
router.get("/", getBankDetails);


// Admin updates bank details
router.put("/", auth, admin, updateBankDetails);


module.exports = router;
