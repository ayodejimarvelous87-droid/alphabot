const AppError = require("../utils/AppError");
const FundRequest = require("../models/FundRequest");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const User = require("../models/User");
const sendEmail = require("../services/emailService");

// User creates funding request
const createFundRequest = async(req,res,next)=>{

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

next(error);

}

};


// Admin gets all requests
const getFundRequests=async(req,res,next)=>{

try{

const requests=await FundRequest.find()
.sort({createdAt:-1});

res.json(requests);

}catch(error){

next(error);

}

};



const approveFundRequest = async(req,res,next)=>{

try{

const {id}=req.params;

const request=await FundRequest.findById(id);

if(!request){
throw new AppError(
  "Funding request not found",
  404
);
}

if(request.status!=="pending"){
throw new AppError(
  "Funding request already processed",
  400
);
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

const user = await User.findOne({
phone: request.phone
});

if(user?.email){
await sendEmail(
user.email,
"AlphaBot Wallet Funded Successfully",
`Your wallet funding request of ₦${request.amount} has been approved successfully.

Your wallet has been credited.

Thank you for using AlphaBot.`
);
}


res.json({
message:"Funding request approved"
});


}catch(error){

next(error);

}

};




const rejectFundRequest = async(req,res,next)=>{

try{

const {id}=req.params;

const request=await FundRequest.findById(id);

if(!request){
throw new AppError(
  "Funding request not found",
  404
);
}


if(request.status!=="pending"){
throw new AppError(
  "Funding request already processed",
  400
);
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

next(error);

}

};


module.exports={
createFundRequest,
getFundRequests
};
