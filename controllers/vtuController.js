const TransactionPin = require("../models/TransactionPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");

const { buyData } = require("../services/clubkonnectData");


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

return res.status(400).json({
message:"Phone, network, plan, amount and PIN are required"
});

}


// Check PIN

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


// Wallet

const wallet = await Wallet.findOne({
phone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}


if(wallet.balance < Number(amount)){

return res.status(400).json({
message:"Insufficient balance",
balance:wallet.balance
});

}


// Call ClubKonnect first

const providerResponse = await buyData(
phone,
network,
plan
);


console.log(
"ClubKonnect Data Response:",
providerResponse
);


// Detect failure

if(
providerResponse.success === false ||
String(providerResponse).toLowerCase().includes("failed")
){

return res.status(400).json({
message:"Data purchase failed",
providerResponse
});

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

balanceBefore,

balanceAfter:wallet.balance,

service:"data",

description:`${network} ${plan} data purchase`,

status:"successful"

});



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
