const AppError = require("../utils/AppError");
const BettingSetting = require("../models/BettingSetting");


// Get betting settings
const getBettingSettings = async(req,res)=>{

try{

const settings = await BettingSetting.find()
.sort({service:1});


res.json(settings);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Update betting setting
const updateBettingSetting = async(req,res)=>{

try{

const setting =
await BettingSetting.findOne({
service:req.params.service
});


if(!setting){

throw new AppError(
  "Betting setting not found",
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
message:"Betting setting updated",
setting
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports = {
getBettingSettings,
updateBettingSetting
};
