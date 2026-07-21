const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
addBankBeneficiary,
getBankBeneficiaries,
sendMoney
} = require("../controllers/transferController");


// Save bank beneficiary
router.post(
"/beneficiary",
auth,
addBankBeneficiary
);


// Get saved bank beneficiaries
router.get(
"/beneficiaries/:phone",
auth,
getBankBeneficiaries
);


// Send money
router.post(
"/send",
auth,
sendMoney
);


module.exports = router;
