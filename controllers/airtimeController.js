const TransactionPin = require("../models/TransactionPin");
const Airtime = require("../models/Airtime");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");
const { purchaseAirtime } = require("../services/vtuService");


// Buy airtime

const buyAirtime = async(req,res)=>{

try{

const { network, amount, pin } = req.body;


if(!network || !amount){

return res.status(400).json({
message:"Network and amount are required"
});

}


// Use authenticated user's phone

console.log("AUTH USER:", req.user);

const cleanPhone = normalizePhone(req.user.phone);



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



const providerResponse = await purchaseAirtime({

phone: cleanPhone,

network,

amount:Number(amount),

request_id:reference

});



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



wallet.balance -= Number(
providerResponse.data.amount_charged || amount
);


await wallet.save();



const airtime = await Airtime.create({

phone:cleanPhone,

network,

amount:Number(amount),

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

message:error.response?.data || error.message

});

}


};



module.exports = {
buyAirtime
};
