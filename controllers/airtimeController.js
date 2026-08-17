const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const AirtimeOverride = require("../models/AirtimeOverride");
const TransactionPin = require("../models/TransactionPin");
const {
  verifyTransactionAuthorization
} = require("../utils/transactionAuthorization");
const Airtime = require("../models/Airtime");
const Profit = require("../models/Profit");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");
const getErrorMessage = require("../utils/errorHandler");
const { purchaseAirtime } = require("../services/vtuService");
const { purchase } = require("../services/blitzPayService");
const { checkProviderBalance } = require("../services/providerGuard");
const { checkIdempotency } = require("../utils/idempotency");
const { checkFraudLimits } = require("../services/fraudDetectionService");
const sendEmail = require("../services/emailService");
const { awardPurchaseCoins } = require("../services/abCoinService");


// Buy airtime

const buyAirtime = async(req,res)=>{

try{

const {
  network,
  amount,
  pin,
  biometricToken,
  phone
} = req.body;


const idempotencyKey =
req.headers["idempotency-key"];

if(!idempotencyKey){
throw new AppError("Idempotency key required",400);
}

const existingTransaction =
await checkIdempotency(idempotencyKey);

if(existingTransaction){

return res.json({
message:"Transaction already processed",
transaction:existingTransaction
});

}


if(
!network ||
!amount ||
Number(amount) <= 0
){

throw new AppError("Network and amount are required", 400);

}


// Separate wallet owner phone from airtime destination phone

console.log("AUTH USER:", req.user);

const userPhone = normalizePhone(req.user.phone);
const airtimePhone = normalizePhone(phone);


if(!userPhone){
throw new AppError("Invalid user phone number",400);
}


if(!airtimePhone){
throw new AppError("Invalid recipient phone number",400);
}


console.log({
jwtPhone: req.user.phone,
bodyPhone: phone,
userPhone,
airtimePhone
});

const authorized =
await verifyTransactionAuthorization({
  phone:userPhone,
  pin,
  biometricToken
});

if(!authorized){

throw new AppError(
  biometricToken
    ? "Fingerprint authorization expired or invalid"
    : "Incorrect transaction PIN",
  400
);

}



const wallet = await Wallet.findOne({
phone: userPhone
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

const discount = Number(airtimeSetting?.discount || 0);

const providerAmount =
Number(amount) - (Number(amount) * discount / 100);





let providerResponse;




const balanceBefore = wallet.balance;


await checkFraudLimits({
  phone:airtimePhone,
  amount:Number(amount),
  type:"airtime",
  ip:req.ip,
  userAgent:req.headers["user-agent"]
});


wallet.balance -= Number(amount);


await wallet.save();




try{




// PRIMARY AIRTIME PROVIDER: BLITZPAY

try {

providerResponse = await purchase({

type:"airtime",

network,

phone:airtimePhone,

amount:Number(amount)

});

console.log(
"BLITZ AIRTIME RESPONSE:",
JSON.stringify(providerResponse, null, 2)
);


if(
!providerResponse ||
providerResponse.success !== true ||
providerResponse.status !== "success"
){

throw new Error("Primary BlitzPay airtime provider failed");

}


}catch(primaryError){


console.log(
"Primary BlitzPay airtime failed, trying VTU.ng:",
primaryError.message
);


// FALLBACK AIRTIME PROVIDER: VTU.ng

await checkProviderBalance("vtu");

providerResponse = await purchaseAirtime({

phone: airtimePhone,

network,

amount:Number(amount),

request_id:reference

});

console.log(
"VTU AIRTIME FALLBACK RESPONSE:",
JSON.stringify(providerResponse, null, 2)
);


if(
!providerResponse ||
providerResponse.code !== "success"
){

throw new Error("VTU.ng airtime fallback provider failed");

}


}



}catch(error){

console.log(
"AIRTIME PURCHASE ERROR:",
error.message
);


// Record the failed purchase attempt FIRST.
// This is used by Network Status availability.

await Transaction.create({

phone:userPhone,

type:"airtime",

direction:"debit",

amount:Number(amount),

reference,

idempotencyKey,

vtuRequestId:
providerResponse?.reference ||
providerResponse?.request_id ||
reference,

providerResponse:
providerResponse || {
  error:error.message
},

service:"airtime",

network:String(network).toUpperCase(),

balanceBefore,

balanceAfter:wallet.balance,

description:`${network} airtime purchase failed`,

status:"failed"

});


// Refund the customer's wallet.

wallet.balance += Number(amount);

await wallet.save();


await Transaction.create({

phone:userPhone,

type:"refund",

direction:"credit",

amount:Number(amount),

reference:`${reference}-REFUND`,

providerResponse: providerResponse,

originalReference:reference,

service:"airtime",

network:String(network).toUpperCase(),

balanceBefore:wallet.balance - Number(amount),

balanceAfter:wallet.balance,

description:"Automatic refund - Airtime failed",

status:"successful"

});


await createNotification(
  userPhone,
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

phone:userPhone,

network,

amount:Number(amount),

providerCost,

profit,

source: providerResponse.source || "provider",

reference,

providerResponse: providerResponse,


status:"successful"

});






const transaction = await Transaction.create({

phone:userPhone,

type:"airtime",

direction:"debit",

amount:Number(amount),

reference,

vtuRequestId:
providerResponse?.reference ||
providerResponse?.request_id ||
reference,


providerResponse: providerResponse,

service:"airtime",

network:String(network).toUpperCase(),

balanceBefore,

balanceAfter:wallet.balance,

description:`${network} airtime purchase`,

status:"successful"

});


await awardPurchaseCoins(transaction);


await Profit.create({

service:"airtime",

customerAmount:Number(amount),

providerCost,

profit,

source: providerResponse.source || "provider",

reference,

providerResponse: providerResponse,


phone:userPhone

});



const cashback = Math.floor(
Number(amount) * 0.005
);



if(cashback > 0){

const cashbackBefore = wallet.balance;


wallet.balance += cashback;


await wallet.save();



await Transaction.create({

phone:userPhone,

type:"cashback",

direction:"credit",

amount:cashback,

reference,


providerResponse: providerResponse,


balanceBefore:cashbackBefore,

balanceAfter:wallet.balance,

description:"Airtime cashback reward",

status:"successful"

});

}



await createNotification(

userPhone,

"Airtime Purchase Successful",

`₦${Number(amount).toLocaleString()} ${network} airtime purchased.`,

"success",

transaction._id

);



if(req.user?.email){

  try{

    await sendEmail(
      req.user.email,
      "Airtime Purchase Successful",
      `Your ₦${Number(amount).toLocaleString()} ${network} airtime purchase was successful.`
    );

  }catch(emailError){

    console.log(
      "Airtime email failed:",
      emailError.message
    );

  }

}


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