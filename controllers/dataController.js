const TransactionPin = require("../models/TransactionPin");
const Data = require("../models/Data");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");
const { vtuRequest } = require("../services/vtuService");


// Buy Data

const buyData = async(req,res)=>{

try{


const {
network,
plan,
amount,
phone,
pin,
variation_id
}=req.body;



if(!network || !plan || !amount){

return res.status(400).json({
message:"Network, plan and amount are required"
});

}


// Use logged in user's phone for wallet

const userPhone = normalizePhone(req.user.phone);


// Data recipient can be different
const dataPhone = normalizePhone(phone || req.user.phone);



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
message:"Insufficient wallet balance"
});

}



const reference = "DATA-" + Date.now();



// Send to VTU.ng

const providerResponse = await vtuRequest(
"/api/v2/data",
{
request_id:reference,
phone:dataPhone,
service_id:network.toLowerCase(),
variation_id
}
);



if(
!providerResponse ||
providerResponse.code !== "success"
){

return res.status(400).json({
message:"Data purchase failed",
providerResponse
});

}



const balanceBefore = wallet.balance;


wallet.balance -= Number(amount);


await wallet.save();



const data = await Data.create({

phone:dataPhone,

network,

plan,

amount:Number(amount),

reference,

status:"successful"

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

message:error.response?.data || error.message

});

}


};



module.exports={
buyData
};
