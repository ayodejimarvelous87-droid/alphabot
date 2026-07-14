const Withdrawal = require("../models/Withdrawal");
const TransactionPin = require("../models/TransactionPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const SystemSetting = require("../models/SystemSetting");
const { createNotification } = require("../services/notificationService");


const withdraw = async(req,res)=>{

try{


const {
phone,
bankName,
accountNumber,
accountName,
amount,
pin
}=req.body;



if(!phone || !bankName || !accountNumber || !accountName || !amount || !pin){

return res.status(400).json({
message:"All withdrawal details and transaction PIN are required"
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



if(wallet.balance < total){

return res.status(400).json({
message:"Insufficient wallet balance"
});

}



const balanceBefore = wallet.balance;


wallet.balance -= total;


await wallet.save();



const reference =
"WD-" + Date.now();



const withdrawal = await Withdrawal.create({

phone,
bankName,
accountNumber,
accountName,
amount:Number(amount),
fee,
totalDeducted:total,
reference

});





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





await createNotification(

phone,

"Withdrawal Successful",

`₦${Number(amount).toLocaleString()} withdrawal processed. Fee: ₦${fee.toFixed(2)}`,

"success"

);





res.json({

message:"Withdrawal successful",

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
