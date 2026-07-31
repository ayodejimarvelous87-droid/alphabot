const AppError = require("../utils/AppError");
const auditLogger = require("../services/auditLogger");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const Withdrawal = require("../models/Withdrawal");
const TransactionPin = require("../models/TransactionPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const SystemSetting = require("../models/SystemSetting");
const { createNotification } = require("../services/notificationService");
const User = require("../models/User");
const { checkFraudLimits } = require("../services/fraudDetectionService");


const withdraw = async(req,res,next)=>{

try{


const {
phone,
amount,
pin
}=req.body;


const idempotencyKey =
req.headers["idempotency-key"];



if(!phone || !amount || !pin){

throw new AppError("Phone, amount and transaction PIN are required", 400);

}

if(Number(amount) <= 0){

throw new AppError("Invalid withdrawal amount", 400);

}



// Check transaction PIN

const userPin = await TransactionPin.findOne({
phone
});


if(!userPin){

throw new AppError("Create transaction PIN first", 400);

}


if(!(await bcrypt.compare(pin,userPin.pin))){

throw new AppError("Incorrect transaction PIN", 400);

}


const user = await User.findOne({phone});

if(!user || !user.withdrawAccountNumber){

throw new AppError("Please save withdrawal account first", 400);

}

const bankName = user.withdrawBankName;
const bankCode = user.withdrawBankCode;
const accountNumber = user.withdrawAccountNumber;
let accountName = user.withdrawAccountName;


// Verify bank account with Flutterwave

try {

const verifyResponse = await axios.post(

"https://api.flutterwave.com/v3/accounts/resolve",

{
account_number: accountNumber,
account_bank: req.body.bankCode
},

{
headers:{
Authorization:`Bearer ${process.env.FLW_SECRET_KEY}`,
"Content-Type":"application/json"
}
}

);


if(
!verifyResponse.data ||
verifyResponse.data.status !== "success"
){

throw new AppError("Bank account verification failed", 400);

}


// Use Flutterwave verified account name
accountName = verifyResponse.data.data.account_name;


}catch(error){

throw new AppError("Unable to verify bank account", 400);

}




const wallet = await Wallet.findOne({
phone
});


if(!wallet){

throw new AppError("Wallet not found", 404);

}



const setting =
await SystemSetting.findOne() ||
await SystemSetting.create({});



const fee =
Number(amount) *
(setting.withdrawalFeeRate / 100);



const total =
Number(amount) + fee;




await checkFraudLimits({
  phone,
  amount: total,
  type:"withdrawal",
  ip:req.ip,
  userAgent:req.headers["user-agent"]
});

const balanceBefore = wallet.balance;


if(idempotencyKey){

const existingWithdrawal = await Withdrawal.findOne({
idempotencyKey
});

if(existingWithdrawal){

return res.json({
message:"Withdrawal already processed",
withdrawal:existingWithdrawal
});

}

}


const updatedWallet = await Wallet.findOneAndUpdate(
{
phone,
balance:{
$gte: total
}
},
{
$inc:{
balance:-total
}
},
{
new:true
}
);


if(!updatedWallet){

throw new AppError("Insufficient wallet balance", 400);

}


wallet = updatedWallet;



const reference =
"WD-" + Date.now();



let withdrawal;

try {

withdrawal = await Withdrawal.create({

phone,
bankName,
accountNumber,
accountName,
amount:Number(amount),
fee,
totalDeducted:total,
reference,
idempotencyKey,
status:"pending"

});

} catch(error) {

await Wallet.findOneAndUpdate(
{
phone
},
{
$inc:{
balance: total
}
}
);

throw error;

}


await createNotification(
  "admin",
  "New Withdrawal Request",
  `New withdrawal request of ₦${Number(amount).toLocaleString()} from ${phone}`,
  "info"
);





try {

await Transaction.create({

phone,

type:"withdrawal",

direction:"debit",

amount:total,

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:"Wallet withdrawal",

status:"pending"

});

} catch(error) {

await Wallet.findOneAndUpdate(
{
phone
},
{
$inc:{
balance: total
}
}
);

await Withdrawal.deleteOne({
reference
});

throw error;

}





await createNotification(

phone,

"Withdrawal Request Received",

`Your ₦${Number(amount).toLocaleString()} withdrawal request has been received and is being processed.`,

"success"

);





await auditLogger({
actor:phone,
role:"user",
action:"WITHDRAWAL_REQUEST",
target:accountNumber,
ip:req.ip,
userAgent:req.headers["user-agent"],
details:{amount:Number(amount),bankName}
});

res.json({


message:"Withdrawal request submitted successfully",

withdrawal,

balance:wallet.balance

});



}catch(error){

next(error);

}


};


module.exports={
withdraw
};


const getWithdrawals = async(req,res,next)=>{

try{

const withdrawals = await Withdrawal.find({
phone:req.params.phone
})
.sort({
createdAt:-1
});


res.json(withdrawals);


}catch(error){

next(error);

}

};


module.exports.getWithdrawals = getWithdrawals;