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
      apiResponse.data?.request_id ||
      apiResponse.request_id ||
      apiResponse.reference ||
      reference,

      vtuOrderId:
      apiResponse.data?.order_id ||
      apiResponse.data?.order ||
      apiResponse.order_id ||
      null,

      providerResponse:apiResponse,

order_id:orderId,

status:epinStatus

});


const transactionData = {

phone:buyerPhone,

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

status:epinStatus

};

const vtuRequestId =
apiResponse.data?.request_id ||
apiResponse.request_id ||
apiResponse.reference ||
reference;

const vtuOrderId =
apiResponse.data?.order_id ||
apiResponse.data?.order ||
apiResponse.order_id;

if(vtuRequestId){
  transactionData.vtuRequestId = String(vtuRequestId);
}

if(vtuOrderId){
  transactionData.vtuOrderId = String(vtuOrderId);
}

const transaction =
  await Transaction.create(transactionData);


const user =
  await User.findOne({
    phone:buyerPhone
  });


if(
  user?.email &&
  pins.length > 0
){

  await sendEmail(
    user.email,
    "Your ePIN Purchase",
    `Your ${network} ePIN codes are:\n\n${pins.join("\n")}\n\nThank you for using AlphaBot.`
  );

  transaction.emailSent = true;

  await transaction.save();

}


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

epinStatus === "successful" ? "success" : "info",

transaction._id

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
