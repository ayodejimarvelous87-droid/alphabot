const AppError = require("../utils/AppError");
const AirtimeCash = require("../models/AirtimeCash");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const SystemSetting = require("../models/SystemSetting");

const normalizePhone = require("../utils/phone");

const {
  generateOTP,
  verifyOTP,
  transferAirtime
} = require("../services/a2cService");


// Generate OTP
const generateAirtimeOTP = async(req,res,next)=>{
try{

const {
networkName,
sender
}=req.body;


const result = await generateOTP(
networkName,
normalizePhone(sender)
);


res.json(result);


}catch(error){

next(error);

}

};


// Verify OTP
const verifyAirtimeOTP = async(req,res,next)=>{
try{

const {
networkName,
sender,
otp
}=req.body;


const result = await verifyOTP(
networkName,
normalizePhone(sender),
otp
);


res.json(result);


}catch(error){

next(error);

}

};



// Convert airtime automatically
const convertAirtime = async(req,res,next)=>{
try{

const {
phone,
networkName,
amount,
sessionId,
pin
}=req.body;



if(Number(amount) < 50){
  throw new AppError(
    "Minimum Airtime Cash conversion amount is ₦50",
    400
  );
}

const cleanPhone = normalizePhone(phone);





// Create request
const request = await AirtimeCash.create({

phone:cleanPhone,

network:networkName,

amount:Number(amount),

cashAmount:0,

reference:"ATC-"+Date.now()

});



// Transfer airtime
let result;

try {

result = await transferAirtime({

networkName,

sender:cleanPhone,

amount:Number(amount),

reference:request.reference,

pin,

sessionId

});

} catch(error) {

request.status = "rejected";
await request.save();

throw new AppError(
  "Airtime transfer failed",
  400
);

}

console.log("A2C TRANSFER RESULT:", result);



// Successful conversion
if(result.code === 2000){


  const existingTransaction = await Transaction.findOne({
    reference: request.reference
  });

  if(existingTransaction){

    return res.json({
      message:"Airtime already converted",
      transaction:existingTransaction
    });

  }


  // Dynamic Airtime Cash payout
  const setting = await SystemSetting.findOne();

  const profitRate = setting?.airtimeCashProfit ?? 15;

  const cashAmount =
  Number(amount) * ((100 - profitRate) / 100);



request.cashAmount = cashAmount;
request.status = "approved";

await request.save();



let wallet = await Wallet.findOne({
phone:cleanPhone
});


if(!wallet){

wallet = await Wallet.create({
phone:cleanPhone,
balance:cashAmount
});

}else{

wallet.balance += cashAmount;

await wallet.save();

}



const balanceBefore = wallet.balance - cashAmount;

const transaction = await Transaction.create({

phone:cleanPhone,

type:"airtime_cash",

direction:"credit",

amount:cashAmount,

reference:request.reference,

balanceBefore,

balanceAfter:wallet.balance,

providerResponse: result,

service:"airtime_cash",

description:"Airtime to cash conversion",

status:"successful"

});

await Notification.create({
  phone:cleanPhone,
  title:"Airtime Cash Successful",
  message:`Your ₦${amount} airtime has been converted successfully. ₦${cashAmount} has been added to your wallet.`,
  type:"wallet",
transactionId: transaction._id
});





return res.json({

message:"Airtime converted successfully",

cashAmount,

wallet

});


}



// Failed

request.status="rejected";

await request.save();


throw new AppError(
  result.message || "Airtime cash conversion failed",
  400
);



}catch(error){

next(error);

}

};



// User requests
const getAirtimeCash = async(req,res,next)=>{
try{

const phone = normalizePhone(
req.params.phone
);


const requests =
await AirtimeCash.find({
phone
})
.sort({
createdAt:-1
});


res.json(requests);


}catch(error){

next(error);

}

};



module.exports={

generateAirtimeOTP,

verifyAirtimeOTP,

convertAirtime,


getAirtimeCash

};
