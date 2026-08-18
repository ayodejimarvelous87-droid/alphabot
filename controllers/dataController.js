const mongoose = require("mongoose");
const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const TransactionPin = require("../models/TransactionPin");
const {
  verifyTransactionAuthorization
} = require("../utils/transactionAuthorization");
const Data = require("../models/Data");
const Profit = require("../models/Profit");
const DataPrice = require("../models/DataPrice");
const ProductOverride = require("../models/ProductOverride");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");
const getErrorMessage = require("../utils/errorHandler");

const {
checkIdempotency
} = require("../utils/idempotency");

const { vtuRequest, purchaseProduct } = require("../services/vtuService");
const { purchase } = require("../services/blitzPayService");
const { purchaseData } = require("../services/oplugService");
const { checkFraudLimits } = require("../services/fraudDetectionService");
const { checkProviderBalance } = require("../services/providerGuard");
const { addBlogCommission } = require("../services/blogCommissionService");
const { awardPurchaseCoins } = require("../services/abCoinService");



const buyData = async (req,res,next)=>{

try{


let {
network,
plan,
amount,
phone,
pin,
biometricToken,
variation_id,
provider
}=req.body;


const idempotencyKey =
req.headers["idempotency-key"];

if(!idempotencyKey){
throw new AppError("Idempotency key required",400);
}

const existingTransaction =
await checkIdempotency(idempotencyKey);

if(existingTransaction){

return res.json({
message:
  existingTransaction.status === "successful"
    ? "Transaction already processed"
    : existingTransaction.status === "processing"
      ? "Transaction is already being processed"
      : "Transaction already processed",
transaction:existingTransaction
});

}


if(
!network ||
!variation_id
){
throw new AppError(
"Network and variation_id are required",
400
);
}




const providerKey =
  String(provider || "").trim().toLowerCase();

// Provider selection is exact.
// There is intentionally NO provider fallback.
const allowedProviders = new Set([
  "vtu",
  "blitzpay",
  "oplug"
]);

if (!allowedProviders.has(providerKey)) {
  throw new AppError(
    `Unsupported data provider: ${providerKey || "none"}`,
    400
  );
}

provider = providerKey;

const requestedNetwork =
  String(network || "").trim().toUpperCase();

const productId =
  `${providerKey}:${requestedNetwork}:${String(variation_id)}`;

// First try the exact ProductOverride identity.
let dataPrice = await ProductOverride.findOne({
  productId
});

// Exact provider + network + variation_id lookup only.
// No alternate OPLUG ID resolution and no provider fallback.

console.log("DATAPRICE DEBUG:", {
  productId,
  provider:providerKey,
  network:requestedNetwork,
  variation_id,
  dataPrice
});

if(!dataPrice){
  throw new AppError("Invalid data plan",400);
}


if(
dataPrice.network &&
dataPrice.network.toUpperCase() !== network.toUpperCase()
){
  throw new AppError("Data plan network mismatch",400);
}


if(dataPrice.active === false){
  throw new AppError("Data plan unavailable",400);
}

const customerAmount = Number(dataPrice.sellingPrice);
const providerAmount = Number(dataPrice.providerPrice);

if(customerAmount <= 0 || providerAmount <= 0){
  throw new AppError("Invalid data plan price",400);
}

amount = customerAmount;


const userPhone = normalizePhone(req.user.phone);

const dataPhone =
normalizePhone(phone || req.user.phone);


if(!dataPhone){
throw new AppError("Invalid phone number",400);
}


const authorized =
await verifyTransactionAuthorization({
  phone:userPhone,
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


await checkFraudLimits({

phone:userPhone,

amount:Number(dataPrice.providerPrice),

type:"data",

ip:req.ip,

userAgent:req.headers["user-agent"]

});



const wallet = await Wallet.findOne({
phone:userPhone
});

console.log("WALLET FOUND DEBUG:", {
 userPhone,
 walletFound: !!wallet,
 walletPhone: wallet?.phone,
 walletBalance: wallet?.balance
});


if(!wallet){

throw new AppError("Wallet not found", 404);

}



console.log("WALLET CHECK DEBUG:", {
  userPhone,
  walletPhone: wallet?.phone,
  walletBalance: wallet?.balance,
  amount,
  customerAmount,
  variation_id,
  provider
});

if(wallet.balance < Number(amount)){

throw new AppError("Insufficient balance", 400);

}



const reference =
"DATA-" + Date.now();


let balanceBefore;
let reservationCreated = false;


// ---------------------------------------------------------
// Atomically reserve the idempotency key AND debit wallet.
// The unique idempotencyKey prevents concurrent requests
// from reaching the provider twice.
// ---------------------------------------------------------

const reservationSession =
await mongoose.startSession();

try {

await reservationSession.withTransaction(async () => {

  const existing =
    await Transaction.findOne({
      idempotencyKey
    }).session(reservationSession);

  if(existing){
    throw new AppError(
      "Transaction already processed",
      409
    );
  }


  const walletForUpdate =
    await Wallet.findOne({
      phone:userPhone,
      balance:{$gte:Number(amount)}
    }).session(reservationSession);

  if(!walletForUpdate){
    throw new AppError(
      "Insufficient balance",
      400
    );
  }


  balanceBefore =
    walletForUpdate.balance;


  walletForUpdate.balance -= Number(amount);

  await walletForUpdate.save({
    session:reservationSession
  });


  await Transaction.create([{

    phone:userPhone,

    type:"data",

    direction:"debit",

    amount:Number(amount),

    reference,

    idempotencyKey,

    providerResponse:null,

    service:"data",

    network:String(network).toUpperCase(),

    balanceBefore,

    balanceAfter:walletForUpdate.balance,

    description:`${network} data purchase`,

    status:"processing"

  }], {
    session:reservationSession
  });


  reservationCreated = true;

});

} catch(error) {

  // A concurrent request may have won the unique
  // idempotencyKey race. Return that transaction instead
  // of allowing another provider purchase.

  if(error?.code === 11000){

    const existing =
      await Transaction.findOne({
        idempotencyKey
      });

    if(existing){

      return res.json({
        message:"Transaction already processed",
        transaction:existing
      });

    }

  }

  throw error;

} finally {

  await reservationSession.endSession();

}


if(!reservationCreated){

  throw new AppError(
    "Unable to reserve transaction",
    500
  );

}

// The wallet was already atomically debited during reservation.
// Reload it so later balance calculations use the reserved balance.



let providerResponse;



try{


await checkProviderBalance(provider);

if(providerKey === "blitzpay"){



console.log("BLITZPAY AMOUNT CHECK:", {variation_id, amount, network});
  console.log("BLITZPAY DATA REQUEST:", {
    type:"data",
    network,
    phone:dataPhone,
    package_id: variation_id || plan,
    amount:Number(dataPrice.providerPrice)
  });
  providerResponse = await purchase({
  type:"data",
  network,
  phone:dataPhone,
  package_id: variation_id || plan,
  amount:Number(dataPrice.providerPrice)
  });

if(
providerResponse?.details?.network &&
providerResponse.details.network.toUpperCase() !== network.toUpperCase()
){
throw new Error(`Provider network mismatch: requested ${network}, returned ${providerResponse.details.network}`);
}





  console.log("BLITZPAY RAW RESPONSE:", JSON.stringify(providerResponse, null, 2));
console.log("BLITZPAY RESPONSE:", JSON.stringify(providerResponse, null, 2));
  console.log("BLITZPAY RAW RESPONSE:", JSON.stringify(providerResponse, null, 2));

if(!providerResponse || providerResponse.success !== true){
 throw new Error(providerResponse?.error || providerResponse?.message || "BlitzPay data purchase failed");
}

}



else if(providerKey === "oplug"){

console.log("DATA OPLUG BUY:", {network, variation_id, provider});
console.log("OPLUG REQUEST BEFORE PURCHASE:", {network, variation_id, dataPhone});
providerResponse = await purchaseData({
network,
planId: dataPrice.providerPlanId || variation_id,
phone:dataPhone
});

console.log(
  "OPLUG RAW PROVIDER RESPONSE:",
  JSON.stringify(providerResponse, null, 2)
);

if(
providerResponse?.details?.network &&
providerResponse.details.network.toUpperCase() !== network.toUpperCase()
){
throw new Error(`Provider network mismatch: requested ${network}, returned ${providerResponse.details.network}`);
}
if(
!providerResponse ||
String(
  providerResponse.status ||
  providerResponse.Status ||
  providerResponse.data?.status ||
  ""
).trim().toLowerCase() !== "success"
){
throw new Error(
providerResponse?.message ||
providerResponse?.error ||
providerResponse?.msg ||
providerResponse?.data?.message ||
"OPLUG data purchase failed"
);
}

}else if(providerKey === "vtu"){



providerResponse = await purchaseProduct(
dataPhone,
{
variation_id:
  String(
    dataPrice.providerPlanId ||
    variation_id ||
    plan
  ),
network
}
);

if(
providerResponse?.details?.network &&
providerResponse.details.network.toUpperCase() !== network.toUpperCase()
){
throw new Error(`Provider network mismatch: requested ${network}, returned ${providerResponse.details.network}`);
}



console.log("VTU RESPONSE:", JSON.stringify(providerResponse,null,2));

if(
!providerResponse ||
providerResponse.code !== "success"
){

throw new Error(
providerResponse?.message?.message ||
providerResponse?.message ||
providerResponse?.error ||
"VTU data purchase failed"
);

}


}




else{

  throw new Error(
    `Unsupported data provider: ${providerKey || "unknown"}`
  );

}

}catch(error){

console.log("REAL DATA ERROR:", error.message);
console.log(
  "REAL DATA ERROR OBJECT:",
  JSON.stringify(error, null, 2)
);

console.log(
  "REAL DATA ERROR RESPONSE:",
  JSON.stringify(error.response?.data, null, 2)
);

console.log(
  "REAL DATA ERROR STATUS:",
  error.response?.status
);

console.log(
  "REAL DATA ERROR HEADERS:",
  JSON.stringify(error.response?.headers, null, 2)
);


let refundTransaction = null;

const recoverySession =
await mongoose.startSession();

try {

await recoverySession.withTransaction(async () => {

  // Lock the original transaction so a retry/recovery
  // cannot refund the same purchase twice.

  const originalTransaction =
    await Transaction.findOne({
      idempotencyKey
    }).session(recoverySession);

  if(!originalTransaction){

    throw new Error(
      "Original data transaction not found during refund"
    );

  }


  // If another recovery already completed the refund,
  // do absolutely nothing again.

  if(originalTransaction.status === "refunded"){

    return;

  }


  const existingRefund =
    await Transaction.findOne({
      originalReference:reference,
      type:"refund"
    }).session(recoverySession);

  if(existingRefund){

    await Transaction.updateOne(
      {_id:originalTransaction._id},
      {
        $set:{
          status:"refunded",
          providerResponse:
            providerResponse || {
              error:error.message
            }
        }
      },
      {
        session:recoverySession
      }
    );

    refundTransaction = existingRefund;

    return;

  }


  const walletForRefund =
    await Wallet.findOne({
      phone:userPhone
    }).session(recoverySession);

  if(!walletForRefund){

    throw new Error(
      "Wallet not found during automatic refund"
    );

  }


  const refundBalanceBefore =
    walletForRefund.balance;


  walletForRefund.balance += Number(amount);

  await walletForRefund.save({
    session:recoverySession
  });


  await Transaction.updateOne(
    {_id:originalTransaction._id},
    {
      $set:{
        status:"refunded",
        providerResponse:
          providerResponse || {
            error:error.message
          },
        balanceAfter:walletForRefund.balance
      }
    },
    {
      session:recoverySession
    }
  );


  const createdRefund =
    await Transaction.create([{

      phone:userPhone,

      type:"refund",

      direction:"credit",

      amount:Number(amount),

      reference:`${reference}-REFUND`,

      originalReference:reference,

      service:"data",

      network:String(network).toUpperCase(),

      balanceBefore:refundBalanceBefore,

      balanceAfter:walletForRefund.balance,

      description:"Automatic refund - Data failed",

      status:"successful"

    }], {
      session:recoverySession
    });


  refundTransaction = createdRefund[0];

});

} finally {

  await recoverySession.endSession();

}


if(refundTransaction){

  await createNotification(
    userPhone,
    "Data Purchase Failed",
    `Your ₦${Number(amount).toLocaleString()} has been refunded to your wallet.`,
    "warning",
    refundTransaction._id
  );

}


console.log("DATA PURCHASE ERROR:", error.message);
console.log(
  "DATA PURCHASE FULL ERROR:",
  JSON.stringify(error.response?.data || error,null,2)
);

throw new AppError(
  error.message || "Data purchase failed",
  400
);

}




const data = await Data.create({
  plan: variation_id || plan,

phone:dataPhone,

network,
plan,

amount:Number(amount),

reference,

status:"successful"

});


const providerCost =
Number(dataPrice.providerPrice || amount);


const profit =
Number(amount) - providerCost;


await addBlogCommission({
  phone:userPhone,
  amount:Number(amount),
  profit,
  reference,
  service:"data"
});


await Profit.create({

service:"data",

customerAmount:Number(amount),

providerCost,

profit,

source:"provider",

reference,

phone:userPhone

});





    const refreshedWallet = await Wallet.findOne({
      phone:userPhone
    });

    if(!refreshedWallet){
      throw new AppError(
        "Wallet not found while completing data transaction",
        500
      );
    }

    const transaction =
      await Transaction.findOneAndUpdate(

        {
          idempotencyKey
        },

        {
          $set:{
            status:"successful",

            vtuRequestId:
              providerResponse?.reference ||
              providerResponse?.request_id ||
              reference,

            ...(providerResponse?.data?.order ||
                providerResponse?.order_id
              ? {
                  vtuOrderId:
                    providerResponse?.data?.order ||
                    providerResponse?.order_id
                }
              : {}),

            providerResponse,

            balanceAfter:refreshedWallet.balance,

            description:`${network} data purchase`
          }
        },

        {
          new:true
        }

      );

  if(!transaction){

    throw new AppError(
      "Successful transaction record not found",
      500
    );

  }


  await awardPurchaseCoins(transaction);




await createNotification(

userPhone,

"Data Purchase Successful",

`${network} data plan purchased.`,

"success",

transaction._id

);




if(req.user?.email){

  try{

    await sendEmail(
      req.user.email,
      "Data Purchase Successful",
      `Your ${network} data plan purchase was successful.`
    );

  }catch(emailError){

    console.log(
      "Data email failed:",
      emailError.message
    );

  }

}


res.json({

message:"Data purchase successful",

data,

balance:wallet.balance,

providerResponse

});



}catch(error){
console.log("REAL DATA ERROR:", error.message);
console.log("REAL DATA ERROR OBJECT:", JSON.stringify(error, null, 2));


console.log(
"Data error:",
error.response?.data || error.message
);



next(error);


}

};



module.exports = {
buyData
};
