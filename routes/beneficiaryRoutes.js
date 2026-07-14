const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
saveBeneficiary,
getBeneficiaries,
deleteBeneficiary
} = require("../controllers/beneficiaryController");

router.post("/", auth, saveBeneficiary);

router.get("/:phone", auth, getBeneficiaries);

router.delete("/:id", auth, deleteBeneficiary);

module.exports = router;
