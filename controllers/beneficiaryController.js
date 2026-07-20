const Beneficiary = require("../models/Beneficiary");


const addBeneficiary = async(req,res)=>{

try{

const {
name,
beneficiary_phone,
service
}=req.body;


const phone=req.user.phone;


const beneficiary = await Beneficiary.create({

phone,
name,
beneficiary_phone,
service

});


res.json({
message:"Beneficiary added",
beneficiary
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const getBeneficiaries = async(req,res)=>{

try{

const phone=req.user.phone;


const beneficiaries =
await Beneficiary.find({phone});


res.json(beneficiaries);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports={
addBeneficiary,
getBeneficiaries
};
