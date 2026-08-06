const express=require("express");

const router=express.Router();

const auth=require("../middleware/auth");

const {
addBeneficiary,
getBeneficiaries,
deleteBeneficiary
}=require("../controllers/beneficiaryController");


router.post(
"/add",
auth,
addBeneficiary
);


router.get(
"/all",
auth,
getBeneficiaries
);


router.delete(
"/:id",
auth,
deleteBeneficiary
);


module.exports=router;
