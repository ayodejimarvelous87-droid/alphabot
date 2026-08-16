const AppError = require("../utils/AppError");
const {
  verifyTransactionAuthorization
} = require("../utils/transactionAuthorization");
const ExamPin = require("../models/ExamPin");
const { addBlogCommission } = require("../services/blogCommissionService");
const Wallet = require("../models/wallet");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const User = require("../models/User");
const sendEmail = require("../services/emailService");
const { checkFraudLimits } = require("../services/fraudDetectionService");
const { awardPurchaseCoins } = require("../services/abCoinService");


const buyExamPin = async(req,res)=>{

let phone;
let total = 0;
let reference = "";

try{

const {
exam,
quantity,
pin,
biometricToken
}=req.body;

const idempotencyKey =
req.headers["idempotency-key"];

phone = req.user.phone;


if(!exam || !quantity){

throw new AppError(
"Exam type and quantity are required",
400
);

}


if(Number(quantity) <= 0 || isNaN(Number(quantity))){

throw new AppError(
"Invalid quantity",
400
);

}


const authorized =
await verifyTransactionAuthorization({
phone,
pin,
biometricToken
});

if(!authorized){

throw new AppError(
biometricToken
? "Fingerprint authorization expired or invalid"
: "Incorrect transaction PIN",
400
);

}


const pins = await ExamPin.find({
exam,
status:"available"
})
.limit(Number(quantity));

if(pins.length < Number(quantity)){

throw new AppError(
"Insufficient PIN stock",
400
);

}


total = pins.reduce(
(sum,item)=>sum + item.price,
0
);


await checkFraudLimits({

phone,

amount:total,

type:"exam_pin",

ip:req.ip,

userAgent:req.headers["user-agent"]

});


reference =
"EXAM-" + Date.now();


const session =
await mongoose.startSession();

let purchasedPins = [];
let balance = 0;

try{

await session.withTransaction(async()=>{

const existingTransaction =
await Transaction.findOne({
idempotencyKey
}).session(session);

if(existingTransaction){

throw new AppError(
"Transaction already processed",
409
);

}


const wallet =
await Wallet.findOne({
phone,
balance:{$gte:total}
}).session(session);

if(!wallet){

throw new AppError(
"Insufficient wallet balance",
400
);

}


const balanceBefore =
wallet.balance;


wallet.balance -= total;

await wallet.save({
session
});


for(const item of pins){

const updatedPin =
await ExamPin.findOneAndUpdate(
{
_id:item._id,
status:"available"
},
{
$set:{
status:"used",
usedBy:phone,
usedAt:new Date(),
reference
}
},
{
new:true,
session
}
);

if(!updatedPin){

throw new AppError(
"Exam PIN stock changed. Please try again.",
409
);

}

purchasedPins.push(
updatedPin.pin
);

}


await Transaction.create(
[{
phone,

type:"exam_pin",

service:"exam_pin",

direction:"debit",

amount:total,

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${exam} PIN purchase`,

status:"successful",

idempotencyKey

}],
{
session
}
);


balance =
wallet.balance;

});

}catch(error){

throw error;

}finally{

await session.endSession();

}


const user =
await User.findOne({
phone
});


if(user?.email && purchasedPins.length > 0){

try{

await sendEmail(
user.email,
"Your Exam PIN Purchase",
`Your ${exam} PIN code(s):\n\n${purchasedPins.join("\n")}\n\nThank you for using AlphaBot.`
);

}catch(error){

console.log(
"Exam PIN email error:",
error.message
);

}

}


const examTransaction =
await Transaction.findOne({
reference
});


if(examTransaction){

try{

await awardPurchaseCoins(
examTransaction
);

}catch(error){

console.log(
"Exam PIN coin award error:",
error.message
);

}


try{

await addBlogCommission({
phone,
amount:Number(total),
reference,
service:"exam_pin"
});

}catch(error){

console.log(
"Exam PIN commission error:",
error.message
);

}

}


try{

await createNotification(

phone,

"Exam PIN Purchase Successful",

`${exam} PIN purchased successfully.`,

"success"

);

}catch(error){

console.log(
"Exam PIN notification error:",
error.message
);

}


return res.json({

message:"Exam PIN purchase successful",

pins:purchasedPins,

balance

});


}catch(error){

console.log(
"Exam PIN error:",
error.message
);


return res.status(
error.statusCode || 500
).json({

message:error.message

});

}

};

module.exports={
buyExamPin
};
