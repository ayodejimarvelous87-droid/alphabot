const AppError = require("../utils/AppError");
const auditLogger = require("../services/auditLogger");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const crypto = require("crypto");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const TransactionPin = require("../models/TransactionPin");
const BankBeneficiary = require("../models/BankBeneficiary");
const TransferSetting = require("../models/TransferSetting");
const { checkFraudLimits } = require("../services/fraudDetectionService");


// Add bank beneficiary
const addBankBeneficiary = async(req,res)=>{

try{

const {
phone,
bankName,
bankCode,
accountNumber,
accountName
}=req.body;


const verifyResponse = await axios.post(

"https://api.flutterwave.com/v3/accounts/resolve",

{
account_number: accountNumber,
account_bank: bankCode
},

{
headers:{
Authorization:`Bearer ${process.env.FLW_SECRET_KEY}`,
"Content-Type":"application/json"
}
}

);


if(
!verifyResponse.data ||
verifyResponse.data.status !== "success"
){

throw new AppError("Bank account verification failed", 400);

}


// Use verified Flutterwave account name
const verifiedName =
verifyResponse.data.data.account_name;


const beneficiary = await BankBeneficiary.create({
phone,
bankName,
bankCode,
accountNumber,
accountName: verifiedName
});


res.json({
message:"Bank beneficiary saved successfully",
beneficiary
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Get saved beneficiaries
const getBankBeneficiaries = async(req,res)=>{

try{

const beneficiaries = await BankBeneficiary.find({
phone:req.user.phone
});


res.json(beneficiaries);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Send money

const sendMoney = async(req,res)=>{

try{

const {
phone,
bankCode,
accountNumber,
accountName,
pin,
amount,
idempotencyKey
}=req.body;


if(Number(amount) <= 0){

throw new AppError("Invalid transfer amount",400);

}


if(!idempotencyKey){

throw new AppError("Idempotency key required",400);

}


const userPin = await TransactionPin.findOne({
phone
});


if(!pin){
  throw new AppError("Transaction PIN is required",400);
}


if(!userPin || !(await bcrypt.compare(pin,userPin.pin))){

throw new AppError("Invalid transaction PIN", 400);

}


const setting = await TransferSetting.findOne();


const fee =
setting && setting.feeEnabled
? Number(setting.transferFee)
:0;


const total =
Number(amount)+fee;


const reference =
"ALPHATRANS-"+Date.now();


if(idempotencyKey){

const existingTransfer = await Transaction.findOne({
idempotencyKey
});

if(existingTransfer){

return res.json({
message:"Transfer already processed",
transaction:existingTransfer
});

}

}



await checkFraudLimits({
  phone,
  amount: total,
  type:"bank_transfer",
  ip:req.ip,
  userAgent:req.headers["user-agent"]
});

const wallet = await Wallet.findOneAndUpdate(
{
phone,
balance:{
$gte:total
}
},
{
$inc:{
balance:-total
}
},
{
new:true
}
);


if(!wallet){

throw new AppError("Insufficient balance", 400);

}



const balanceAfter = wallet.balance;
const balanceBefore = balanceAfter + total;

const pendingTransaction = await Transaction.create({
phone,
type:"bank_transfer",
direction:"debit",
amount:total,
reference,
idempotencyKey,
service:"bank_transfer",
balanceBefore,
balanceAfter,
description:`Transfer to ${accountName}`,
status:"pending"
});




try{

const transferResponse = await axios.post(

"https://api.flutterwave.com/v3/transfers",

{
account_bank:bankCode,
account_number:accountNumber,
amount:Number(amount),
currency:"NGN",
reference,
narration:"AlphaBot Bank Transfer",
beneficiary_name:accountName
},

{
timeout:10000,
headers:{
Authorization:`Bearer ${process.env.FLW_SECRET_KEY}`,
"Content-Type":"application/json",
"Idempotency-Key": reference
}
}

);



if(
!transferResponse.data ||
transferResponse.data.status !== "success"
){

throw new Error("Transfer failed");

}



await Transaction.findOneAndUpdate(
{reference},
{
status:"successful",
flutterwaveId:String(transferResponse.data.data?.id || ""),
providerResponse:transferResponse.data
}
);



await auditLogger({
actor:phone,
role:"user",
action:"BANK_TRANSFER_SUCCESS",
target:accountNumber,
ip:req.ip,
userAgent:req.headers["user-agent"],
details:{amount:Number(amount),bankCode}
});

res.json({


message:"Transfer successful",

balance:wallet.balance

});



}catch(error){

const isConfirmedFailure =
error.response?.data?.status === "error" ||
error.message === "Transfer failed";


if(isConfirmedFailure){

await Wallet.findOneAndUpdate(
{
phone
},
{
$inc:{
balance:total
}
}
);


await Transaction.findOneAndUpdate(
{reference},
{
status:"failed",
reason:error.message,
providerResponse:error.response?.data || null
}
);


}else{


await Transaction.findOneAndUpdate(
{reference},
{
status:"pending",
reason:"Transfer status unknown - requires verification"
}
);


}


throw error;

}



}catch(error){

res.status(500).json({
message:error.response?.data || error.message
});

}

};


module.exports={
addBankBeneficiary,
getBankBeneficiaries,
sendMoney
};