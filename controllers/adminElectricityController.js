const AppError = require("../utils/AppError");
const ElectricitySetting = require("../models/ElectricitySetting");


// Get electricity settings
const getElectricitySettings = async(req,res)=>{

try{

const settings = await ElectricitySetting.find()
.sort({disco:1});


res.json(settings);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Update electricity setting
const updateElectricitySetting = async(req,res)=>{

try{

const setting =
await ElectricitySetting.findOne({
disco:req.params.disco
});


if(!setting){

throw new AppError(
  "Electricity setting not found",
  404
);

}


if(req.body.fee !== undefined){

setting.fee =
Number(req.body.fee);

}


if(req.body.active !== undefined){

setting.active =
req.body.active;

}


await setting.save();


res.json({
message:"Electricity setting updated",
setting
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports={
getElectricitySettings,
updateElectricitySetting
};
