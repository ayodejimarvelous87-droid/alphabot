const TransferSetting = require("../models/TransferSetting");


const getTransferPublicSettings = async(req,res)=>{

try{

const settings =
await TransferSetting.findOne() ||
await TransferSetting.create({});


res.json({

transferFee: settings.transferFee,

feeEnabled: settings.feeEnabled,

promoActive: settings.promoActive,

promoMessage: settings.promoMessage

});


}catch(error){

res.status(500).json({
message:"Unable to load transfer settings"
});

}

};


module.exports={
getTransferPublicSettings
};
