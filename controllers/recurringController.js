const AppError = require("../utils/AppError");
const Recurring = require("../models/Recurring");
const normalizePhone = require("../utils/phone");


// Create recurring payment
const createRecurring = async(req,res)=>{
try{

const {
    phone,
    targetPhone,
    service,
    provider,
    productId,
    variationId,
    network,
    planName,
    amount,
    frequency
}=req.body;


const cleanPhone = normalizePhone(phone);

const cleanTargetPhone = normalizePhone(targetPhone);


if(req.user.role !== "admin" && req.user.phone !== cleanPhone){
return res.status(403).json({
message:"Unauthorized"
});
}


let nextRun = new Date();


if(frequency === "daily"){
nextRun.setDate(nextRun.getDate()+1);
}

if(frequency === "weekly"){
nextRun.setDate(nextRun.getDate()+7);
}

if(frequency === "monthly"){
nextRun.setMonth(nextRun.getMonth()+1);
}



// Data recurring payments must identify the exact data plan.
// Airtime continues to use the existing amount-based behaviour.
if(service === "data"){

  if(!variationId || !network){
    return res.status(400).json({
      message:"Data plan and network are required"
    });
  }

}

const recurring = await Recurring.create({

phone:cleanPhone,
targetPhone:cleanTargetPhone,
service,
provider:service === "data" ? provider : "",
productId:service === "airtime" ? productId : null,
variationId:service === "data" ? String(variationId) : "",
network:service === "data" ? network : "",
planName:service === "data" ? (planName || "") : "",
amount:Number(amount),
frequency,
nextRun

});


res.json({
message:"Recurring payment created",
recurring
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Get recurring payments
const getRecurring = async(req,res)=>{
try{

const cleanPhone = normalizePhone(req.params.phone);


if(req.user.phone !== cleanPhone && req.user.role !== "admin"){
return res.status(403).json({
message:"Unauthorized"
});
}


const recurring = await Recurring.find({
phone:cleanPhone
}).sort({
createdAt:-1
});


res.json(recurring);


}catch(error){

res.status(500).json({
message:error.message
});

}

};




// Cancel recurring
const cancelRecurring = async(req,res)=>{
try{

const recurring = await Recurring.findById(
req.params.id
);


if(!recurring){
throw new AppError(
  "Recurring payment not found",
  404
);
}


recurring.status="cancelled";

await recurring.save();


res.json({
message:"Recurring payment cancelled"
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports={
createRecurring,
getRecurring,
cancelRecurring
};
