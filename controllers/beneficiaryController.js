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




const deleteBeneficiary = async(req,res)=>{

try{

console.log("DELETE DEBUG:", req.params.id, req.user.phone);

const deleted = await Beneficiary.findOneAndDelete({
_id:req.params.id,
phone:req.user.phone
});

if(!deleted){
return res.status(404).json({
message:"Beneficiary not found"
});
}

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
addBeneficiary,
getBeneficiaries,
deleteBeneficiary
};
