const FundRequest = require("../models/FundRequest");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

// User creates funding request
const createFundRequest = async(req,res)=>{

try{

const {phone,amount,reference,bankName}=req.body;

if(req.user.phone!==phone){
return res.status(403).json({
message:"Unauthorized"
});
}

const request=await FundRequest.create({
phone,
amount:Number(amount),
reference,
bankName
});

res.json({
message:"Funding request submitted",
request
});

}catch(error){

res.status(500).json({
message:error.message
});

}

};


// Admin gets all requests
const getFundRequests=async(req,res)=>{

try{

const requests=await FundRequest.find()
.sort({createdAt:-1});

res.json(requests);

}catch(error){

res.status(500).json({
message:error.message
});

}

};



const approveFundRequest = async(req,res)=>{

try{

const {id}=req.params;

const request=await FundRequest.findById(id);

if(!request){
return res.status(404).json({
message:"Funding request not found"
});
}

if(request.status!=="pending"){
return res.status(400).json({
message:"Funding request already processed"
});
}

let wallet=await Wallet.findOne({
phone:request.phone
});

const balanceBefore=wallet ? wallet.balance : 0;

if(!wallet){

wallet=await Wallet.create({
phone:request.phone,
balance:Number(request.amount)
});

}else{

wallet.balance+=Number(request.amount);
await wallet.save();

}


const transaction = await Transaction.create({
phone:request.phone,
type:"fund",
direction:"credit",
amount:Number(request.amount),
balanceBefore,
balanceAfter:wallet.balance,
description:"Manual funding approved"
});


request.status="approved";
await request.save();


await Notification.create({
phone:request.phone,
title:"Funding Approved",
message:`Your wallet has been credited with ₦${request.amount}.`,
type:"success",
transactionId: transaction._id
});


res.json({
message:"Funding request approved"
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};




const rejectFundRequest = async(req,res)=>{

try{

const {id}=req.params;

const request=await FundRequest.findById(id);

if(!request){
return res.status(404).json({
message:"Funding request not found"
});
}


if(request.status!=="pending"){
return res.status(400).json({
message:"Funding request already processed"
});
}


request.status="rejected";

await request.save();


await Notification.create({
phone:request.phone,
title:"Funding Rejected",
message:`Your funding request of ₦${request.amount} was rejected.`,
type:"warning"
});


res.json({
message:"Funding request rejected"
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports={
createFundRequest,
getFundRequests
};
