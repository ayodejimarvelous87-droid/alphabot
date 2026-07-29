const axios = require("axios");
const Withdrawal = require("../models/Withdrawal");
const TransactionPin = require("../models/TransactionPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const SystemSetting = require("../models/SystemSetting");
const { createNotification } = require("../services/notificationService");
const User = require("../models/User");


const withdraw = async(req,res)=>{

try{


const {
phone,
amount,
pin
}=req.body;



if(!phone || !amount || !pin){

return res.status(400).json({
message:"Phone, amount and transaction PIN are required"
});

}



// Check transaction PIN

const userPin = await TransactionPin.findOne({
phone
});


if(!userPin){

return res.status(400).json({
message:"Create transaction PIN first"
});

}


if(userPin.pin !== pin){

return res.status(400).json({
message:"Incorrect transaction PIN"
});

}


const user = await User.findOne({phone});

if(!user || !user.withdrawAccountNumber){

return res.status(400).json({
message:"Please save withdrawal account first"
});

}

const bankName = user.withdrawBankName;
const bankCode = user.withdrawBankCode;
const accountNumber = user.withdrawAccountNumber;
const accountName = user.withdrawAccountName;


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

return res.status(400).json({
message:"Bank account verification failed"
});

}


// Use Flutterwave verified account name
accountName = verifyResponse.data.data.account_name;


}catch(error){

return res.status(400).json({
message:"Unable to verify bank account"
});

}




const wallet = await Wallet.findOne({
phone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}



const setting =
await SystemSetting.findOne() ||
await SystemSetting.create({});



const fee =
Number(amount) *
(setting.withdrawalFeeRate / 100);



const total =
Number(amount) + fee;



const balanceBefore = wallet.balance;


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

return res.status(400).json({
message:"Insufficient wallet balance"
});

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
status:"pending"

});

} catch(error) {

wallet.balance += total;
await wallet.save();

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

status:"successful"

});

} catch(error) {

wallet.balance += total;
await wallet.save();

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





res.json({

message:"Withdrawal request submitted successfully",

withdrawal,

balance:wallet.balance

});



}catch(error){

res.status(500).json({

message:error.message

});

}


};


module.exports={
withdraw
};


const getWithdrawals = async(req,res)=>{

try{

const withdrawals = await Withdrawal.find({
phone:req.params.phone
})
.sort({
createdAt:-1
});


res.json(withdrawals);


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports.getWithdrawals = getWithdrawals;
