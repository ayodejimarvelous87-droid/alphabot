const Beneficiary = require("../models/Beneficiary");
const normalizePhone = require("../utils/phone");

// Save beneficiary
const saveBeneficiary = async (req,res)=>{
try{

const {
phone,
owner,
service,
network,
nickname
} = req.body;

const cleanPhone = normalizePhone(phone);

if(req.user.role !== "admin" && req.user.phone !== cleanPhone){
return res.status(403).json({
message:"Unauthorized"
});
}

const beneficiary = await Beneficiary.create({
phone:cleanPhone,
targetPhone:cleanPhone,
owner,
service,
network,
nickname
});

res.json({
message:"Beneficiary saved",
beneficiary
});

}catch(error){

res.status(500).json({
message:error.message
});

}
};


// Get beneficiaries
const getBeneficiaries = async(req,res)=>{
try{

const cleanPhone = normalizePhone(req.params.phone);

if(req.user.phone !== cleanPhone && req.user.role !== "admin"){
return res.status(403).json({
message:"Unauthorized"
});
}

const beneficiaries = await Beneficiary.find({
phone:cleanPhone
}).sort({
createdAt:-1
});

res.json(beneficiaries);

}catch(error){

res.status(500).json({
message:error.message
});

}
};


// Delete beneficiary
const deleteBeneficiary = async(req,res)=>{
try{

await Beneficiary.findByIdAndDelete(req.params.id);

res.json({
message:"Beneficiary deleted"
});

}catch(error){

res.status(500).json({
message:error.message
});

}
};

module.exports={
saveBeneficiary,
getBeneficiaries,
deleteBeneficiary
};
