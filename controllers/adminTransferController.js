const TransferSetting = require("../models/TransferSetting");


// Get transfer settings
const getTransferSettings = async(req,res)=>{

try{

let settings = await TransferSetting.findOne();

if(!settings){

settings = await TransferSetting.create({});

}

res.json(settings);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Update transfer settings
const updateTransferSettings = async(req,res)=>{

try{

const {
transferFee,
feeEnabled,
promoActive,
promoMessage
}=req.body;


let settings = await TransferSetting.findOne();


if(!settings){

settings = new TransferSetting();

}


if(transferFee !== undefined)
settings.transferFee = transferFee;


if(feeEnabled !== undefined)
settings.feeEnabled = feeEnabled;


if(promoActive !== undefined)
settings.promoActive = promoActive;


if(promoMessage !== undefined)
settings.promoMessage = promoMessage;


await settings.save();


res.json({

message:"Transfer settings updated",

settings

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports = {
getTransferSettings,
updateTransferSettings
};
