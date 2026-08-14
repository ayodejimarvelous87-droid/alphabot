const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const TransactionPin = require("../models/TransactionPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { awardPurchaseCoins } = require("../services/abCoinService");



const buyDataController = async (req,res)=>{

try{

const {
phone,
network,
plan,
amount,
pin
}=req.body;


if(!phone || !network || !plan || !amount || !pin){

throw new AppError(
  "Phone, network, plan, amount and PIN are required",
  400
);

}


// Check PIN

const userPin = await TransactionPin.findOne({
phone
});


if(!userPin){

throw new AppError(
  "Create transaction PIN first",
  400
);

}


if(!(await bcrypt.compare(pin,userPin.pin))){

throw new AppError(
  "Incorrect transaction PIN",
  400
);

}


// Wallet

const wallet = await Wallet.findOne({
phone
});


if(!wallet){

throw new AppError(
  "Wallet not found",
  404
);

}


if(wallet.balance < Number(amount)){

throw new AppError(
  "Insufficient balance",
  400
);

}


// Call ClubKonnect first

const providerResponse = {
  success: false,
  message: "Data provider not connected yet"
};


console.log(
"ClubKonnect Data Response:",
providerResponse
);


// Detect failure

if(
providerResponse.success === false ||
String(providerResponse).toLowerCase().includes("failed")
){

throw new AppError(
  "Data purchase failed",
  400
);

}


// Deduct wallet after success

const balanceBefore = wallet.balance;

wallet.balance -= Number(amount);

await wallet.save();



const transaction = await Transaction.create({

phone,

type:"purchase",

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

service:"data",

description:`${network} ${plan} data purchase`,

status:"successful"

});


await awardPurchaseCoins(transaction);



res.json({

message:"Data purchase successful",

transaction,

providerResponse,

newBalance:wallet.balance

});


}catch(error){

console.log(error);

res.status(500).json({
message:error.message
});

}

};



module.exports = {
buyData: buyDataController
};
