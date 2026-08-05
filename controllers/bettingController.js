const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const TransactionPin = require("../models/TransactionPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const BettingSetting = require("../models/BettingSetting");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");
const { checkIdempotency } = require("../utils/idempotency");
const { checkFraudLimits } = require("../services/fraudDetectionService");
const { addBlogCommission } = require("../services/blogCommissionService");

const {
  verifyCustomer,
  purchaseBetting
} = require("../services/vtuService");


const fundBetting = async (req,res)=>{

try{

const {
customer_id,
service_id,
amount,
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




const phone = normalizePhone(req.user.phone);


if(!customer_id || !service_id || !amount || !pin){

throw new AppError(
"Customer ID, service, amount and PIN required",
400
);

}


if(isNaN(Number(amount)) || Number(amount) <= 0){

throw new AppError(
"Invalid amount",
400
);

}


const userPin = await TransactionPin.findOne({
  phone:{
    $in:[
      req.user.phone,
      phone,
      "+234" + phone.replace(/^0/,"")
    ]
  }
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


const wallet = await Wallet.findOne({
phone
});


if(!wallet){

throw new AppError(
"Wallet not found",
404
);

}




const bettingSetting =
  await BettingSetting.findOne({
    service:{
      $regex: new RegExp("^" + service_id + "$", "i")
    }
  });


if(!bettingSetting){

throw new AppError(
"Betting service not configured",
400
);

}


if(!bettingSetting.active){

throw new AppError(
"Betting service unavailable",
400
);

}


const serviceFee =
Number(bettingSetting.fee || 0);


const totalAmount =
Number(amount) + serviceFee;


await checkFraudLimits({

phone,

amount:totalAmount,

type:"betting",

ip:req.ip,

userAgent:req.headers["user-agent"]

});


if(wallet.balance < totalAmount){

throw new AppError(
"Insufficient wallet balance",
400
);

}



const verifyResponse = await verifyCustomer({
customer_id,
service_id
});


if(!verifyResponse || verifyResponse.code !== "success"){

throw new AppError(
"Bet account verification failed",
400
);

}



const reference = "BET-" + Date.now();

const balanceBefore = wallet.balance;

wallet.balance -= totalAmount;

await wallet.save();

let providerResponse;

try{

providerResponse = await purchaseBetting({
customer_id,
service_id,
amount:Number(amount),
request_id:reference
});

  console.log(
    "BET FUND RESPONSE:",
    JSON.stringify(providerResponse,null,2)
  );
if(!providerResponse || providerResponse.code !== "success"){
throw new Error("Bet funding failed");
}

}catch(err){

  

wallet.balance += totalAmount;

await wallet.save();

await Transaction.create({
phone,
type:"refund",
direction:"credit",
amount:totalAmount,
reference,

idempotencyKey,

originalReference:reference,

service:"betting",

balanceBefore:wallet.balance - totalAmount,
balanceAfter:wallet.balance,
description:"Automatic refund - Betting failed",
status:"successful"
});

  throw new AppError(
    err.response?.data?.message ||
    err.message ||
    "Bet funding failed",
    err.response?.data?.data?.status || 400
  );
}



await Transaction.create({

phone,
type:"betting",
direction:"debit",
amount:totalAmount,
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
description:`Betting wallet funding for ${service_id}`,
status:"successful"

});


await addBlogCommission({
  phone,
  amount:Number(amount),
  reference,
  service:"betting"
});



await createNotification(

phone,

"Betting Account Funded",

`₦${Number(amount).toLocaleString()} sent to ${service_id} betting account.`,

"success"

);



res.json({

message:"Betting funding successful",
balance:wallet.balance,
providerResponse

});


}catch(error){

console.log(
"Betting error:",
error.response?.data || error.message
);


  res.status(
    error.statusCode ||
    error.response?.data?.data?.status ||
    500
  ).json({

    message:
      error.response?.data?.message ||
      error.message ||
      "Betting service error"

  });

}

};




const getAvailableBettingServices = async(req,res)=>{

try{

const services = await BettingSetting.find({
active:true
}).select("service");

res.json(services);

}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports = {
fundBetting,
getAvailableBettingServices
};
