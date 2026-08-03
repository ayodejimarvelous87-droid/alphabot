const AppError = require("../utils/AppError");
const TVPlan = require("../models/TVPlan");

const {
getCablePackages
} = require("../services/blitzPayService");



// Get TV plans for admin
const getAdminTVPlans = async(req,res)=>{

try{

let plans = await TVPlan.find()
.sort({provider:1});


if(plans.length === 0){

const providerPlans = await getCablePackages();


for(const plan of providerPlans){

await TVPlan.create({

provider:
plan.provider || plan.service_name || "Unknown",

variation_id:
plan.variation_id || plan.id || plan.code,

name:
plan.name || plan.package || "TV Plan",

providerPrice:
Number(plan.amount || plan.price || 0),

sellingPrice:
Number(plan.amount || plan.price || 0),

active:true

});

}


plans = await TVPlan.find()
.sort({provider:1});

}


res.json(plans);


}catch(error){

res.status(500).json({
message:error.message
});

}

};




// Update TV price
const updateTVPlan = async(req,res)=>{

try{

const plan =
await TVPlan.findById(req.params.id);


if(!plan){

throw new AppError(
  "TV plan not found",
  404
);

}


if(req.body.sellingPrice !== undefined){

plan.sellingPrice =
Number(req.body.sellingPrice);

}


if(req.body.active !== undefined){

plan.active =
req.body.active;

}


await plan.save();


res.json({
message:"TV plan updated",
plan
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports={
getAdminTVPlans,
updateTVPlan
};
