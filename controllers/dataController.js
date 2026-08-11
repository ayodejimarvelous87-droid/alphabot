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
checkIdempotency,
saveIdempotencyKey
} = require("../utils/idempotency");

const { vtuRequest, purchaseProduct } = require("../services/vtuService");
const { purchase } = require("../services/blitzPayService");
const { purchaseData } = require("../services/oplugService");
const { checkFraudLimits } = require("../services/fraudDetectionService");
const { checkProviderBalance } = require("../services/providerGuard");
const { addBlogCommission } = require("../services/blogCommissionService");



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

const existingTransaction =
await checkIdempotency(idempotencyKey);

if(existingTransaction){

return res.json({
message:"Transaction already processed",
transaction:existingTransaction
});

}


if(!idempotencyKey){
throw new AppError("Idempotency key required",400);
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


const balanceBefore =
wallet.balance;



// Debit first

wallet.balance -= Number(amount);

await wallet.save();



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

if(
providerResponse?.details?.network &&
providerResponse.details.network.toUpperCase() !== network.toUpperCase()
){
throw new Error(`Provider network mismatch: requested ${network}, returned ${providerResponse.details.network}`);
}
if(
!providerResponse ||
providerResponse.status === "fail" ||
providerResponse.Status === "failed"
){
throw new Error(
providerResponse.message ||
providerResponse.error ||
providerResponse.msg ||
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
console.log("REAL DATA ERROR OBJECT:", JSON.stringify(error, null, 2));


// Refund

wallet.balance += Number(amount);

await wallet.save();



await Transaction.create({

phone:userPhone,

type:"refund",

direction:"credit",

amount:Number(dataPrice.providerPrice),

reference,

    idempotencyKey,

originalReference:reference,

service:"data",

balanceBefore:wallet.balance - Number(amount),

balanceAfter:wallet.balance,

description:"Automatic refund - Data failed",

status:"successful"

});


await createNotification(
  userPhone,
  "Data Purchase Failed",
  `Your ₦${Number(amount).toLocaleString()} has been refunded to your wallet.`,
  "warning"
);



console.log("DATA PURCHASE ERROR:", error.message);
console.log("DATA PURCHASE FULL ERROR:", JSON.stringify(error.response?.data || error,null,2));
throw new AppError(error.message || "Data purchase failed", 400);

}




const data = await Data.create({
  plan: variation_id || plan,

phone:dataPhone,

network,
plan,

amount:Number(dataPrice.providerPrice),

reference,

status:"successful"

});


await addBlogCommission({
  phone:userPhone,
  amount:Number(amount),
  reference,
  service:"data"
});


const providerCost =
Number(dataPrice.providerPrice || amount);


const profit =
Number(amount) - providerCost;


await Profit.create({

service:"data",

customerAmount:Number(amount),

providerCost,

profit,

source:"provider",

reference,

phone:userPhone

});





  await Transaction.create({

  phone:userPhone,

  type:"data",

  direction:"debit",

  amount:Number(dataPrice.providerPrice),

  reference,

  vtuRequestId:
    providerResponse?.reference ||
    providerResponse?.request_id ||
    reference,

  ...(providerResponse?.data?.order || providerResponse?.order_id
    ? {
        vtuOrderId:
          providerResponse?.data?.order ||
          providerResponse?.order_id
      }
    : {}),

  providerResponse: providerResponse,

  service:"data",

  balanceBefore,

  balanceAfter:wallet.balance,

  description:`${network} data purchase`,

  status:"successful"

  });




await createNotification(

userPhone,

"Data Purchase Successful",

`${network} data plan purchased.`,

"success"

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
