const AppError = require("../utils/AppError");
const EPin = require("../models/EPin");
const { addBlogCommission } = require("../services/blogCommissionService");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { purchaseEPins } = require("../services/vtuService");
const { createNotification } = require("../services/notificationService");
const sendEmail = require("../services/emailService");
const { checkIdempotency } = require("../utils/idempotency");
const { checkFraudLimits } = require("../services/fraudDetectionService");
const User = require("../models/User");

const normalizePhone = (phone)=>{

if(!phone) return phone;

phone = phone.replace(/\s+/g,"");

if(phone.startsWith("0")){
return "+234" + phone.slice(1);
}

return phone;

};


const buyEPin = async(req,res)=>{

try{

const {
network,
amount,
quantity
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




if(!network || !amount || !quantity){

throw new AppError(
  "Network, amount and quantity are required",
  400
);

}


const buyerPhone = normalizePhone(req.user.phone);

const wallet = await Wallet.findOne({
phone:buyerPhone
});


if(!wallet){

throw new AppError(
  "Wallet not found",
  404
);

}


const total =
Number(amount) * Number(quantity);


if(wallet.balance < total){

throw new AppError(
  "Insufficient wallet balance",
  400
);

}


const balanceBefore = wallet.balance;


const reference =
"EPIN-" + Date.now();



await checkFraudLimits({

phone: buyerPhone,

amount: total,

type:"recharge_pin",

ip:req.ip,

userAgent:req.headers["user-agent"]

});


const apiResponse = await purchaseEPins({

network,
amount:Number(amount),
quantity:Number(quantity),
request_id:reference

});
console.log("EPIN VTU RESPONSE:", JSON.stringify(apiResponse,null,2));


if(
!apiResponse ||
apiResponse.code !== "success"
){
throw new Error("EPIN provider failed");
}



const epinList = apiResponse.data?.epins || apiResponse.data?.pins || apiResponse.epins || apiResponse.pins || [];

const pins = epinList.map(p => typeof p === "string" ? p : p.pin);

const orderId = apiResponse.data?.order_id || null;

const epinStatus = pins.length > 0 ? "successful" : "processing";

wallet.balance -= total;

await wallet.save();

const epin = await EPin.create({

phone:buyerPhone,

network,

amount:Number(amount),

quantity:Number(quantity),

pins,

reference,

      vtuRequestId:
      apiResponse.reference ||
      apiResponse.request_id ||
      reference,

      vtuOrderId:
      apiResponse.data?.order ||
      apiResponse.order_id ||
      null,

      apiResponse: apiResponse,

order_id:orderId,

status:epinStatus

});


const user = await User.findOne({
  phone: buyerPhone
});


if(user?.email && pins.length > 0){

  await sendEmail(
    user.email,
    "Your ePIN Purchase",
    `Your ${network} ePIN codes are:\n\n${pins.join("\n")}\n\nThank you for using AlphaBot.`
  );

}




await Transaction.create({

phone:buyerPhone,

type:"recharge_pin",

service:"recharge_pin",

direction:"debit",

amount:total,

reference,

      vtuRequestId:
      apiResponse.reference ||
      apiResponse.request_id ||
      reference,

      vtuOrderId:
      apiResponse.data?.order ||
      apiResponse.order_id ||
      null,

      apiResponse: apiResponse,

balanceBefore,

balanceAfter:wallet.balance,

description:`${network} recharge PIN purchase`,

status:"successful"

});


await addBlogCommission({
  phone:buyerPhone,
  amount:Number(total),
  reference,
  service:"recharge_pin"
});



await createNotification(

buyerPhone,

"ePIN Purchase",

epinStatus === "successful"
? `${network} recharge PIN generated successfully`
: `${network} recharge PIN order is processing`,

epinStatus === "successful" ? "success" : "info"

);





res.json({

message:
epinStatus === "successful"
? "ePIN purchase successful"
: "ePIN order is processing",

status: epinStatus,

epin,

balance:wallet.balance

});


}catch(error){

console.log(
"EPIN ERROR:",
error.response?.data || error.message
);


res.status(500).json({

message:error.response?.data?.message || error.message

});

}

};


module.exports={
buyEPin
};
