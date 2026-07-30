const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
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
const { checkIdempotency } = require("../utils/idempotency");


// Buy airtime

const buyAirtime = async(req,res)=>{

try{

const { network, amount, pin, phone } = req.body;


const idempotencyKey =
req.headers["idempotency-key"];

const existingTransaction =
await checkIdempotency(idempotencyKey);

if(existingTransaction){

return res.json({
message:"Transaction already processed",
transaction:existingTransaction
});

}


if(!network || !amount){

throw new AppError("Network and amount are required", 400);

}


// Use authenticated user's phone

console.log("AUTH USER:", req.user);

const cleanPhone = normalizePhone(phone || req.user.phone);



const userPin = await TransactionPin.findOne({
phone: cleanPhone
});


if(!userPin){

throw new AppError("Create transaction PIN first", 400);

}


if(!(await bcrypt.compare(pin,userPin.pin))){

throw new AppError("Incorrect transaction PIN", 400);

}



const wallet = await Wallet.findOne({
phone: cleanPhone
});


if(!wallet){

throw new AppError("Wallet not found", 404);

}


if(wallet.balance < Number(amount)){

throw new AppError("Insufficient wallet balance", 400);

}


// Create unique VTU request ID

const reference = "AIRTIME-" + Date.now();



const airtimeSetting = await AirtimeOverride.findOne({network: network.toUpperCase()});

if(airtimeSetting && airtimeSetting.active === false){
throw new AppError("This airtime network is currently unavailable", 400);
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

  idempotencyKey,

vtuRequestId:
providerResponse.reference ||
providerResponse.request_id ||
reference,

vtuOrderId:
providerResponse.data?.order ||
providerResponse.order_id ||
null,

providerResponse: providerResponse,


originalReference:reference,

service:"airtime",

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


throw new AppError("Airtime purchase failed", 400);


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

vtuRequestId:
providerResponse.reference ||
providerResponse.request_id ||
reference,

vtuOrderId:
providerResponse.data?.order ||
providerResponse.order_id ||
null,

providerResponse: providerResponse,


status:"successful"

});



await Transaction.create({

phone:cleanPhone,

type:"airtime",

direction:"debit",

amount:Number(amount),

reference,

vtuRequestId:
providerResponse.reference ||
providerResponse.request_id ||
reference,

vtuOrderId:
providerResponse.data?.order ||
providerResponse.order_id ||
null,

providerResponse: providerResponse,


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

vtuRequestId:
providerResponse.reference ||
providerResponse.request_id ||
reference,

vtuOrderId:
providerResponse.data?.order ||
providerResponse.order_id ||
null,

providerResponse: providerResponse,


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

vtuRequestId:
providerResponse.reference ||
providerResponse.request_id ||
reference,

vtuOrderId:
providerResponse.data?.order ||
providerResponse.order_id ||
null,

providerResponse: providerResponse,


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
