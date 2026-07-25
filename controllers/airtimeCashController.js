const AirtimeCash = require("../models/AirtimeCash");
const SystemSetting = require("../models/SystemSetting");
const AirtimeInventory = require("../models/AirtimeInventory");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");
const { approveAirtimeCash } = require("../services/airtimeCashApprovalService");


// Submit airtime cash request

const requestAirtimeCash = async(req,res)=>{

try{

const {
phone,
network,
amount
}=req.body;


if(!phone || !network || !amount){

return res.status(400).json({
message:"Phone, network and amount are required"
});

}


const cleanPhone = normalizePhone(phone);

const selectedNetwork = network.toUpperCase();

if(
selectedNetwork !== "MTN" &&
selectedNetwork !== "AIRTEL"
){

return res.status(400).json({
message:"Only MTN and Airtel are supported for Airtime to Cash"
});

}


const inventory = await AirtimeInventory.findOne({
network:selectedNetwork
});


if(!inventory){

return res.status(400).json({
message:"Airtime inventory not available"
});

}


const availableAmount =
inventory.limit - inventory.storedAmount;


if(Number(amount) > availableAmount){

return res.status(400).json({
message:`Only ₦${availableAmount.toLocaleString()} airtime is currently available for ${selectedNetwork}. Please try again with the available amount.`
});

}


// Get Airtime To Cash conversion rate

let setting = await SystemSetting.findOne();

if(!setting){

setting = await SystemSetting.create({
airtimeCashRate:80
});

}


const cashAmount =
Number(amount) * (setting.airtimeCashRate / 100);


const request = await AirtimeCash.create({

phone:cleanPhone,

network,

amount:Number(amount),

cashAmount,

reference:"ATC-" + Date.now()

});


// Automatic Airtime To Cash approval

if(setting.airtimeCashMode === "automatic"){

await approveAirtimeCash(request._id);

}


await createNotification(
"system",
"New Airtime To Cash Request",
`${request.phone} submitted ${request.network} airtime worth ₦${request.amount.toLocaleString()}.`,
"info"
);


res.json({

message:"Airtime to cash request submitted",

request

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Get user requests

const getAirtimeCash = async(req,res)=>{

try{

const phone = normalizePhone(
req.params.phone
);


const requests = await AirtimeCash.find({
phone
})
.sort({
createdAt:-1
});


res.json(requests);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports={

requestAirtimeCash,

getAirtimeCash

};
