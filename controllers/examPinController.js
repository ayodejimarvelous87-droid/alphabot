const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const ExamPin = require("../models/ExamPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const TransactionPin = require("../models/TransactionPin");
const { createNotification } = require("../services/notificationService");
const { checkIdempotency } = require("../utils/idempotency");


const buyExamPin = async(req,res)=>{

try{

const {
exam,
quantity,
pin
}=req.body;

const idempotencyKey =
req.headers["idempotency-key"];


const existingTransaction =
await checkIdempotency(idempotencyKey);


if(existingTransaction){

return res.json({
message:"Transaction already processed",
transaction:existingTransaction
});

}




const phone = req.user.phone;


if(!exam || !quantity || !pin){

throw new AppError(
  "Exam type, quantity and transaction PIN are required",
  400
);

}


if(Number(quantity) <= 0 || isNaN(Number(quantity))){

throw new AppError(
  "Invalid quantity",
  400
);

}



const userPin = await TransactionPin.findOne({
phone
});


if(!userPin){

throw new AppError(
  "Create transaction PIN first",
  400
);

}


if(!(await bcrypt.compare(pin,userPin.pin))){

throw new AppError(
  "Incorrect transaction PIN",
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



const total = pins.reduce(
(sum,item)=>sum + item.price,
0
);



const wallet = await Wallet.findOne({
phone
});


if(!wallet){

throw new AppError(
  "Wallet not found",
  404
);

}



if(wallet.balance < total){

throw new AppError(
  "Insufficient wallet balance",
  400
);

}



const balanceBefore = wallet.balance;


wallet.balance -= total;


await wallet.save();



let purchasedPins=[];


for(const item of pins){

item.status="used";
item.usedBy=phone;
item.usedAt=new Date();

await item.save();

purchasedPins.push(item.pin);

}



const reference = "EXAM-" + Date.now();



await Transaction.create({

phone,

type:"exam_pin",

service:"exam_pin",

direction:"debit",

amount:total,

reference,

      vtuRequestId:
      providerResponse.reference ||
      providerResponse.request_id ||
      reference,

      vtuOrderId:
      providerResponse.data?.order ||
      providerResponse.order_id ||
      null,

      providerResponse: providerResponse,

balanceBefore,

balanceAfter:wallet.balance,

description:`${exam} PIN purchase`,

status:"successful"

});



await createNotification(

phone,

"Exam PIN Purchase Successful",

`${exam} PIN purchased successfully.`,

"success"

);



res.json({

message:"Exam PIN purchase successful",

pins:purchasedPins,

balance:wallet.balance

});


}catch(error){

console.log(
"Exam PIN error:",
error.message
);


const refundWallet = await Wallet.findOne({
phone
});

if(refundWallet){

const balanceBeforeRefund = refundWallet.balance;

refundWallet.balance += total;

await refundWallet.save();

await Transaction.create({

phone,

type:"refund",

direction:"credit",

amount:total,

reference,

      vtuRequestId:
      providerResponse.reference ||
      providerResponse.request_id ||
      reference,

      vtuOrderId:
      providerResponse.data?.order ||
      providerResponse.order_id ||
      null,

      providerResponse: providerResponse,

originalReference:reference,

      vtuRequestId:
      providerResponse.reference ||
      providerResponse.request_id ||
      reference,

      vtuOrderId:
      providerResponse.data?.order ||
      providerResponse.order_id ||
      null,

      providerResponse: providerResponse,

service:"exam_pin",

balanceBefore:balanceBeforeRefund,

balanceAfter:refundWallet.balance,

description:"Automatic refund - Exam PIN failed",

status:"successful"

});

}

res.status(500).json({

message:error.message

});

}

};


module.exports={
buyExamPin
};
