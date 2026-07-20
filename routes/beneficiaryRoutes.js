const express=require("express");

const router=express.Router();

const auth=require("../middleware/auth");

const {
addBeneficiary,
getBeneficiaries
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


module.exports=router;
