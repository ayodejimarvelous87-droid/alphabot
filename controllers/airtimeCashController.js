const AirtimeCash = require("../models/AirtimeCash");
const SystemSetting = require("../models/SystemSetting");
const normalizePhone = require("../utils/phone");


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
