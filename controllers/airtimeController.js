const AirtimeOverride = require("../models/AirtimeOverride");
const TransactionPin = require("../models/TransactionPin");
const Airtime = require("../models/Airtime");
const AirtimeInventory = require("../models/AirtimeInventory");
const Profit = require("../models/Profit");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");
const getErrorMessage = require("../utils/errorHandler");
const { purchaseAirtime } = require("../services/vtuService");
const { purchase } = require("../services/blitzPayService");


// Buy airtime

const buyAirtime = async(req,res)=>{

try{

const { network, amount, pin, phone } = req.body;


if(!network || !amount){

return res.status(400).json({
message:"Network and amount are required"
});

}


// Use authenticated user's phone

console.log("AUTH USER:", req.user);

const cleanPhone = normalizePhone(phone || req.user.phone);



const userPin = await TransactionPin.findOne({
phone: cleanPhone
});


if(!userPin){

return res.status(400).json({
message:"Create transaction PIN first"
});

}


if(userPin.pin !== pin){

return res.status(400).json({
message:"Incorrect transaction PIN"
});

}



const wallet = await Wallet.findOne({
phone: cleanPhone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}


if(wallet.balance < Number(amount)){

return res.status(400).json({
message:"Insufficient wallet balance"
});

}


// Create unique VTU request ID

const reference = "AIRTIME-" + Date.now();



const airtimeSetting = await AirtimeOverride.findOne({network: network.toUpperCase()});

if(airtimeSetting && airtimeSetting.active === false){
return res.status(400).json({
message:"This airtime network is currently unavailable"
});
}





let providerResponse;




const balanceBefore = wallet.balance;




wallet.balance -= Number(amount);


await wallet.save();




try{


const inventory = await AirtimeInventory.findOne({
network: network.toUpperCase()
});


if(
inventory &&
inventory.storedAmount >= Number(amount)
){

inventory.storedAmount -= Number(amount);

await inventory.save();


providerResponse = {
code:"success",
source:"inventory",
data:{
amount_charged:Number(amount)
}
};


}else{


try {

providerResponse = await purchaseAirtime({

phone: cleanPhone,

network,

amount:Number(amount),

request_id:reference

});


if(
!providerResponse ||
providerResponse.code !== "success"
){

throw new Error("Primary airtime provider failed");

}


}catch(primaryError){


console.log(
"Primary airtime failed, trying Blitz:",
primaryError.message
);


providerResponse = await purchase({

type:"airtime",

network,

phone:cleanPhone,

amount:Number(amount)

});


if(
!providerResponse ||
providerResponse.success !== true ||
providerResponse.status !== "success"
){

throw new Error("Blitz airtime provider failed");

}


}

}


}catch(error){


wallet.balance += Number(amount);

await wallet.save();


await Transaction.create({

phone:cleanPhone,

type:"refund",

direction:"credit",

amount:Number(amount),

reference,

balanceBefore:wallet.balance - Number(amount),

balanceAfter:wallet.balance,

description:"Automatic refund - Airtime failed",

status:"successful"

});


await createNotification(
  cleanPhone,
  "Airtime Purchase Failed",
  `Your ₦${Number(amount).toLocaleString()} has been refunded to your wallet.`,
  "warning"
);


return res.status(400).json({

message:"Airtime purchase failed",

error:error.message

});


}




const providerCost = Number(
providerResponse.data?.amount_charged || amount
);


const profit = Number(amount) - providerCost;


const airtime = await Airtime.create({

phone:cleanPhone,

network,

amount:Number(amount),

providerCost,

profit,

source: providerResponse.source || "provider",

reference,

status:"successful"

});



await Transaction.create({

phone:cleanPhone,

type:"airtime",

direction:"debit",

amount:Number(amount),

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${network} airtime purchase`,

status:"successful"

});



await Profit.create({

service:"airtime",

customerAmount:Number(amount),

providerCost,

profit,

source: providerResponse.source || "provider",

reference,

phone:cleanPhone

});



const cashback = Math.floor(
Number(amount) * 0.005
);



if(cashback > 0){

const cashbackBefore = wallet.balance;


wallet.balance += cashback;


await wallet.save();



await Transaction.create({

phone:cleanPhone,

type:"cashback",

direction:"credit",

amount:cashback,

reference,

balanceBefore:cashbackBefore,

balanceAfter:wallet.balance,

description:"Airtime cashback reward",

status:"successful"

});

}



await createNotification(

cleanPhone,

"Airtime Purchase Successful",

`₦${Number(amount).toLocaleString()} ${network} airtime purchased.`,

"success"

);



res.json({

message:"Airtime purchase successful",

airtime,

balance:wallet.balance,

providerResponse

});



}catch(error){

console.log(
"Airtime error:",
error.response?.data || error.message
);


res.status(500).json({
success:false,
message:getErrorMessage(error)
});

}


};



module.exports = {
buyAirtime
};
