const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const TransactionPin = require("../models/TransactionPin");
const Data = require("../models/Data");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");
const getErrorMessage = require("../utils/errorHandler");

const {
checkIdempotency,
saveIdempotencyKey
} = require("../utils/idempotency");

const { vtuRequest } = require("../services/vtuService");
const { purchase } = require("../services/blitzPayService");
const { purchaseData } = require("../services/oplugService");



const buyData = async (req,res,next)=>{

try{


const {
network,
plan,
amount,
phone,
pin,
variation_id,
provider
}=req.body;


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



if(!network || !plan || !amount){

throw new AppError("Network, plan and amount are required", 400);

}



const userPhone = normalizePhone(req.user.phone);

const dataPhone =
normalizePhone(phone || req.user.phone);



const userPin = await TransactionPin.findOne({
phone:userPhone
});


if(!userPin){

throw new AppError("Create transaction PIN first", 400);

}



if(!(await bcrypt.compare(pin,userPin.pin))){

throw new AppError("Incorrect transaction PIN", 400);

}



const wallet = await Wallet.findOne({
phone:userPhone
});


if(!wallet){

throw new AppError("Wallet not found", 404);

}



if(wallet.balance < Number(amount)){

throw new AppError("Insufficient balance", 400);

}



const reference =
"DATA-" + Date.now();


const balanceBefore =
wallet.balance;



// Debit first

wallet.balance -= Number(amount);

await wallet.save();



let providerResponse;



try{


if(provider === "blitzpay"){



  providerResponse = await purchase({
  type:"data",
  network,
  phone:dataPhone,
  package_id: variation_id || plan,
  amount:Number(amount)
  });

if(
providerResponse?.details?.network &&
providerResponse.details.network.toUpperCase() !== network.toUpperCase()
){
throw new Error(`OPLUG network mismatch: requested ${network}, returned ${providerResponse.details.network}`);
}





if(
!providerResponse ||
providerResponse.success !== true
){

throw new Error("BlitzPay data purchase failed");

}



}else if(provider === "oplug"){

console.log("DATA OPLUG BUY:", {network, variation_id, provider});
console.log("OPLUG REQUEST BEFORE PURCHASE:", {network, variation_id, dataPhone});
providerResponse = await purchaseData({
network,
planId: variation_id,
phone:dataPhone
});

if(
providerResponse?.details?.network &&
providerResponse.details.network.toUpperCase() !== network.toUpperCase()
){
throw new Error(`OPLUG network mismatch: requested ${network}, returned ${providerResponse.details.network}`);
}
if(
!providerResponse ||
providerResponse.status === "fail" ||
providerResponse.Status === "failed"
){
throw new Error(
providerResponse.message ||
providerResponse.error ||
providerResponse.msg ||
"OPLUG data purchase failed"
);
}

}else{



providerResponse = await vtuRequest(
"/api/v2/data",
{
request_id:reference,
phone:dataPhone,
});

if(
providerResponse?.details?.network &&
providerResponse.details.network.toUpperCase() !== network.toUpperCase()
){
throw new Error(`OPLUG network mismatch: requested ${network}, returned ${providerResponse.details.network}`);
}



if(
!providerResponse ||
providerResponse.code !== "success"
){

throw new Error("VTU data purchase failed");

}


}



}catch(error){


// Refund

wallet.balance += Number(amount);

await wallet.save();



await Transaction.create({

phone:userPhone,

type:"refund",

direction:"credit",

amount:Number(amount),

reference,

    idempotencyKey,

originalReference:reference,

service:"data",

balanceBefore:wallet.balance - Number(amount),

balanceAfter:wallet.balance,

description:"Automatic refund - Data failed",

status:"successful"

});


await createNotification(
  userPhone,
  "Data Purchase Failed",
  `Your ₦${Number(amount).toLocaleString()} has been refunded to your wallet.`,
  "warning"
);



throw new AppError("Data purchase failed", 400);

}




const data = await Data.create({

phone:dataPhone,
});





  await Transaction.create({

  phone:userPhone,

  type:"data",

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

  service:"data",

  balanceBefore,

  balanceAfter:wallet.balance,

  description:`${network} data purchase`,

  status:"successful"

  });




await createNotification(

userPhone,

"Data Purchase Successful",

`${network} data plan purchased.`,

"success"

);



res.json({

message:"Data purchase successful",

data,

balance:wallet.balance,

providerResponse

});



}catch(error){


console.log(
"Data error:",
error.response?.data || error.message
);



next(error);


}

};



module.exports = {
buyData
};
