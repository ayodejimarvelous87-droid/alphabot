const TransactionPin = require("../models/TransactionPin");
const Data = require("../models/Data");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");
const getErrorMessage = require("../utils/errorHandler");

const { vtuRequest } = require("../services/vtuService");
const { purchase } = require("../services/blitzPayService");
const { purchaseData } = require("../services/oplugService");



const buyData = async (req,res)=>{

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



if(!network || !plan || !amount){

return res.status(400).json({
message:"Network, plan and amount are required"
});

}



const userPhone = normalizePhone(req.user.phone);

const dataPhone =
normalizePhone(phone || req.user.phone);



const userPin = await TransactionPin.findOne({
phone:userPhone
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
phone:userPhone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}



if(wallet.balance < Number(amount)){

return res.status(400).json({
message:"Insufficient balance"
});

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

balanceBefore:wallet.balance - Number(amount),

balanceAfter:wallet.balance,

description:"Automatic refund - Data failed",

status:"successful"

});



return res.status(400).json({

message:"Data purchase failed",

error:error.message

});

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



res.status(500).json({
success:false,
message:getErrorMessage(error)
});


}

};



module.exports = {
buyData
};
