const AirtimeCash = require("../models/AirtimeCash");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");


// Get pending requests

const getAirtimeCashRequests = async(req,res)=>{

try{

const requests = await AirtimeCash.find({
status:"pending"
}).sort({
createdAt:-1
});


res.json(requests);


}catch(error){

res.status(500).json({
message:error.message
});

}

};




// Approve request

const approveAirtimeCash = async(req,res)=>{

try{

const request = await AirtimeCash.findById(
req.params.id
);


if(!request){

return res.status(404).json({
message:"Request not found"
});

}


if(request.status !== "pending"){

return res.status(400).json({
message:"Already processed"
});

}



const wallet = await Wallet.findOne({
phone:request.phone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}



const balanceBefore = wallet.balance;


wallet.balance += request.cashAmount;


await wallet.save();



await Transaction.create({

phone:request.phone,

type:"airtime_cash",

direction:"credit",

amount:request.cashAmount,

balanceBefore,

balanceAfter:wallet.balance,

description:"Airtime To Cash Conversion",

status:"successful",

reference:request.reference

});



request.status="approved";

await request.save();



await createNotification(

request.phone,

"Airtime To Cash Approved",

`₦${request.cashAmount.toLocaleString()} has been added to your AlphaBot wallet.`,

"success"

);



res.json({

message:"Airtime cash approved",

wallet

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};




module.exports={

getAirtimeCashRequests,

approveAirtimeCash

};
