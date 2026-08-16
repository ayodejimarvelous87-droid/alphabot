const crypto = require("crypto");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
const { verifyTransactionAuthorization } = require("../utils/transactionAuthorization");
const EPin = require("../models/EPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { awardPurchaseCoins } = require("../services/abCoinService");
const { purchaseEPins } = require("../services/vtuService");
const { createNotification } = require("../services/notificationService");
const sendEmail = require("../services/emailService");
const { checkFraudLimits } = require("../services/fraudDetectionService");
const User = require("../models/User");
const { syncEPin } = require("../services/ePinRequeryService");

const normalizePhone = (phone)=>{

if(!phone) return phone;

phone = phone.replace(/\s+/g,"");

if(phone.startsWith("0")){
return "+234" + phone.slice(1);
}

return phone;

};


const buyEPin = async(req,res)=>{

let phone;
let total = 0;
let reference = "";

try{

const {
network,
amount,
quantity,
pin,
biometricToken
}=req.body;

const idempotencyKey =
req.headers["idempotency-key"];

if(!idempotencyKey){
throw new AppError(
"Idempotency-Key header is required",
400
);
}

phone = normalizePhone(req.user.phone);

if(!network || !amount || !quantity){

throw new AppError(
"Network, amount and quantity are required",
400
);

}

if(Number(amount) <= 0 || isNaN(Number(amount))){

throw new AppError(
"Invalid amount",
400
);

}

if(
Number(quantity) <= 0 ||
isNaN(Number(quantity)) ||
!Number.isInteger(Number(quantity))
){

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

total =
Number(amount) * Number(quantity);

await checkFraudLimits({

phone,

amount:total,

type:"recharge_pin",

ip:req.ip,

userAgent:req.headers["user-agent"]

});

reference =
"EPIN-" + Date.now() + "-" +
crypto.randomBytes(4).toString("hex");

const apiResponse =
await purchaseEPins({

network,
amount:Number(amount),
quantity:Number(quantity),
request_id:reference

});

console.log(
"EPIN VTU RESPONSE:",
JSON.stringify(apiResponse,null,2)
);

if(
!apiResponse ||
apiResponse.code !== "success"
){

throw new Error("EPIN provider failed");

}

const epinList =
apiResponse.data?.epins ||
apiResponse.data?.pins ||
apiResponse.epins ||
apiResponse.pins ||
[];

const pins =
epinList
.map(p =>
typeof p === "string"
? p
: p?.pin
)
.filter(Boolean);

const orderId =
apiResponse.data?.order_id ||
apiResponse.data?.order ||
apiResponse.order_id ||
null;

const epinStatus =
pins.length > 0
? "successful"
: "processing";

const vtuRequestId =
apiResponse.data?.request_id ||
apiResponse.request_id ||
apiResponse.reference ||
reference;

const vtuOrderId =
apiResponse.data?.order_id ||
apiResponse.data?.order ||
apiResponse.order_id ||
null;

const session =
await mongoose.startSession();

let walletBalance = 0;
let epin;
let transaction;

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

epin =
await EPin.create([{

phone,

network,

amount:Number(amount),

quantity:Number(quantity),

pins,

reference,

vtuRequestId:String(vtuRequestId),

vtuOrderId:vtuOrderId
? String(vtuOrderId)
: null,

providerResponse:apiResponse,

order_id:orderId
? String(orderId)
: null,

status:epinStatus

}],{
session
});

const transactionData = {

phone,

type:"recharge_pin",

service:"recharge_pin",

network,

direction:"debit",

amount:total,

reference,

providerResponse:apiResponse,

balanceBefore,

balanceAfter:wallet.balance,

description:`${network} recharge PIN purchase`,

pin:pins.length > 0
? pins.join("\n")
: null,

status:epinStatus,

idempotencyKey

};

if(vtuRequestId){
transactionData.vtuRequestId =
String(vtuRequestId);
}

if(vtuOrderId){
transactionData.vtuOrderId =
String(vtuOrderId);
}

transaction =
await Transaction.create(
[transactionData],
{session}
);

walletBalance =
wallet.balance;

});

}finally{

await session.endSession();

}

epin = Array.isArray(epin)
? epin[0]
: epin;

if(transaction.status === "successful"){
  await awardPurchaseCoins(transaction);
}

const user =
await User.findOne({
phone
});

if(
user?.email &&
pins.length > 0
){

try{

await sendEmail(
user.email,
"Your ePIN Purchase",
`Your ${network} ePIN codes are:\n\n${pins.join("\n")}\n\nThank you for using AlphaBot.`
);

transaction.emailSent = true;

await transaction.save();

}catch(error){

console.log(
"EPIN email error:",
error.message
);

}

}

await createNotification(

phone,

"ePIN Purchase",

epinStatus === "successful"
? `${network} recharge PIN generated successfully`
: `${network} recharge PIN order is processing`,

epinStatus === "successful"
? "success"
: "info",

transaction._id

);

return res.json({

message:
epinStatus === "successful"
? "ePIN purchase successful"
: "ePIN order is processing",

status:epinStatus,

epin,

transaction:{
reference:transaction.reference,
status:transaction.status
},

balance:walletBalance

});

}catch(error){

console.log(
"EPIN ERROR:",
error.response?.data || error.message
);

return res.status(
error.statusCode || 500
).json({

message:
error.response?.data?.message ||
error.message

});

}

};

const getEPinStatus = async(req,res)=>{

  try{

    const { reference } = req.params;

    if(!reference){
      return res.status(400).json({
        message:"Reference is required"
      });
    }


    const buyerPhone =
      normalizePhone(req.user.phone);


    let epin =
      await EPin.findOne({
        reference,
        phone:buyerPhone
      });


    if(!epin){
      return res.status(404).json({
        message:"ePIN order not found"
      });
    }


    // ----------------------------------------------------------
    // If still processing, ask VTU for the latest status.
    // This is what allows a PIN that arrives later to be saved.
    // ----------------------------------------------------------

    if(
      epin.status === "processing" ||
      epin.status === "pending"
    ){

      try{

        const synced =
          await syncEPin(reference);

        if(synced?.epin){
          epin = synced.epin;
        }else{

          epin =
            await EPin.findOne({
              reference,
              phone:buyerPhone
            });

        }

      }catch(syncError){

        console.log(
          "EPIN STATUS REQUERY ERROR:",
          syncError.response?.data ||
          syncError.message
        );

      }

    }


    return res.json({

      status:epin.status,

      epin:{

        reference:epin.reference,

        network:epin.network,

        amount:epin.amount,

        quantity:epin.quantity,

        status:epin.status,

        pins:Array.isArray(epin.pins)
          ? epin.pins
          : []

      }

    });


  }catch(error){

    console.log(
      "GET EPIN STATUS ERROR:",
      error.message
    );

    return res.status(500).json({
      message:"Unable to check ePIN status"
    });

  }

};


module.exports={
buyEPin,
getEPinStatus
};
