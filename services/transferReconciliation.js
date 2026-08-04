
const axios = require("axios");

const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");


async function reconcileTransfers(){

try{

const pendingTransfers = await Transaction.find({
type:"bank_transfer",
status:"pending"
});


for(const transfer of pendingTransfers){

try{

let response;

if(transfer.flutterwaveId){

response = await axios.get(
`https://api.flutterwave.com/v3/transfers/${transfer.flutterwaveId}`,
{
headers:{
Authorization:`Bearer ${process.env.FLW_SECRET_KEY}`
}
}
);

}else{

response = await axios.get(
"https://api.flutterwave.com/v3/transfers",
{
params:{
reference:transfer.reference
},
headers:{
Authorization:`Bearer ${process.env.FLW_SECRET_KEY}`
}
}
);

}


const transferData = Array.isArray(response.data?.data)
? response.data.data[0]
: response.data?.data;

const status = transferData?.status;


if(status === "SUCCESSFUL"){

transfer.status="successful";
transfer.providerResponse=response.data;
transfer.flutterwaveId=String(transferData?.id || transfer.flutterwaveId || "");

await transfer.save();


await createNotification(
transfer.phone,
"Bank Transfer Successful",
"Your bank transfer has been completed successfully.",
"success",
transfer._id
);


continue;

}



if(
status === "FAILED" ||
status === "REVERSED"
){

const wallet = await Wallet.findOne({
phone:transfer.phone
});


const existingRefund = await Transaction.findOne({
originalReference:transfer.reference,
type:"refund"
});


if(wallet && !existingRefund){

const balanceBeforeRefund = wallet.balance;

wallet.balance += transfer.amount;

await wallet.save();


await Transaction.create({

phone:transfer.phone,

type:"refund",

direction:"credit",

amount:transfer.amount,

reference:"REFUND-"+Date.now(),

originalReference:transfer.reference,

service:"bank_transfer",

balanceBefore:balanceBeforeRefund,

balanceAfter:wallet.balance,

description:"Automatic refund - Bank transfer failed",

status:"refunded"

});

}


transfer.status="failed";
transfer.providerResponse=response.data;
transfer.flutterwaveId=String(transferData?.id || transfer.flutterwaveId || "");

await transfer.save();


await createNotification(
transfer.phone,
"Bank Transfer Failed",
"Your transfer failed and your wallet has been refunded.",
"error",
transfer._id
);


}

}catch(error){

console.log(
"Transfer check error:",
error.response?.data || error.message
);

}

}


}catch(error){

console.log(
"Transfer reconciliation error:",
error.message
);

}

}


module.exports = reconcileTransfers;
