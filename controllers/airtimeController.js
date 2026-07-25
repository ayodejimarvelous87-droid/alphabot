const AirtimeOverride = require("../models/AirtimeOverride");
const TransactionPin = require("../models/TransactionPin");
const Airtime = require("../models/Airtime");
const Profit = require("../models/Profit");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");
const getErrorMessage = require("../utils/errorHandler");
const { purchaseAirtime } = require("../services/vtuService");


// Buy airtime

const buyAirtime = async(req,res)=>{

try{

const { network, amount, pin, phone } = req.body;


if(!network || !amount){

return res.status(400).json({
message:"Network and amount are required"
});

}


// Use authenticated user's phone

console.log("AUTH USER:", req.user);

const cleanPhone = normalizePhone(phone || req.user.phone);



const userPin = await TransactionPin.findOne({
phone: cleanPhone
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
phone: cleanPhone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}


if(wallet.balance < Number(amount)){

return res.status(400).json({
message:"Insufficient wallet balance"
});

}


// Create unique VTU request ID

const reference = "AIRTIME-" + Date.now();



const airtimeSetting = await AirtimeOverride.findOne({network: network.toUpperCase()});

if(airtimeSetting && airtimeSetting.active === false){
return res.status(400).json({
message:"This airtime network is currently unavailable"
});
}





// Check provider result

if(
!providerResponse ||
providerResponse.code !== "success"
){

return res.status(400).json({
message:"Airtime purchase failed",
providerResponse
});

}




const balanceBefore = wallet.balance;




wallet.balance -= Number(amount);


await wallet.save();


let providerResponse;


try{


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

throw new Error("Airtime provider failed");

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

balanceBefore:wallet.balance - Number(amount),

balanceAfter:wallet.balance,

description:"Automatic refund - Airtime failed",

status:"successful"

});


return res.status(400).json({

message:"Airtime purchase failed",

error:error.message

});


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

reference,

status:"successful"

});



await Transaction.create({

phone:cleanPhone,

type:"airtime",

direction:"debit",

amount:Number(amount),

reference,

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

reference,

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
