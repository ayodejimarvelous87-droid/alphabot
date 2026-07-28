const TransactionPin = require("../models/TransactionPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const BettingSetting = require("../models/BettingSetting");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");

const {
  verifyCustomer,
  purchaseBetting
} = require("../services/vtuService");


const fundBetting = async (req,res)=>{

try{

const {
customer_id,
service_id,
amount,
pin
}=req.body;


const phone = normalizePhone(req.user.phone);


if(!customer_id || !service_id || !amount || !pin){

return res.status(400).json({
message:"Customer ID, service, amount and PIN required"
});

}


if(isNaN(Number(amount)) || Number(amount) <= 0){

return res.status(400).json({
message:"Invalid amount"
});

}


const userPin = await TransactionPin.findOne({
phone
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
phone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}


const bettingSetting =
await BettingSetting.findOne({
service: service_id
});


if(!bettingSetting){

return res.status(400).json({
message:"Betting service not configured"
});

}


if(!bettingSetting.active){

return res.status(400).json({
message:"Betting service unavailable"
});

}


const serviceFee =
Number(bettingSetting.fee || 0);


const totalAmount =
Number(amount) + serviceFee;


if(wallet.balance < totalAmount){

return res.status(400).json({
message:"Insufficient wallet balance"
});

}



const verifyResponse = await verifyCustomer({
customer_id,
service_id
});


if(!verifyResponse || verifyResponse.code !== "success"){

return res.status(400).json({
message:"Bet account verification failed",
verifyResponse
});

}



const reference = "BET-" + Date.now();

const balanceBefore = wallet.balance;

wallet.balance -= totalAmount;

await wallet.save();

let providerResponse;

try{

providerResponse = await purchaseBetting({
customer_id,
service_id,
amount:Number(amount),
request_id:reference
});

if(!providerResponse || providerResponse.code !== "success"){
throw new Error("Bet funding failed");
}

}catch(err){

wallet.balance += totalAmount;

await wallet.save();

await Transaction.create({
phone,
type:"refund",
direction:"credit",
amount:totalAmount,
reference,
balanceBefore:wallet.balance - totalAmount,
balanceAfter:wallet.balance,
description:"Automatic refund - Betting failed",
status:"successful"
});

return res.status(400).json({
message:"Bet funding failed",
providerResponse:err.message
});

}



await Transaction.create({

phone,
type:"betting",
direction:"debit",
amount:totalAmount,
reference,
balanceBefore,
balanceAfter:wallet.balance,
description:`Betting wallet funding for ${service_id}`,
status:"successful"

});



await createNotification(

phone,

"Betting Account Funded",

`₦${Number(amount).toLocaleString()} sent to ${service_id} betting account.`,

"success"

);



res.json({

message:"Betting funding successful",
balance:wallet.balance,
providerResponse

});


}catch(error){

console.log(
"Betting error:",
error.response?.data || error.message
);


res.status(500).json({

message:"Betting service error"

});

}

};



module.exports = {
fundBetting
};