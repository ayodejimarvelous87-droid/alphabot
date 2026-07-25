const axios = require("axios");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const TransactionPin = require("../models/TransactionPin");
const BankBeneficiary = require("../models/BankBeneficiary");
const TransferSetting = require("../models/TransferSetting");


// Add bank beneficiary
const addBankBeneficiary = async(req,res)=>{

try{

const {
phone,
bankName,
bankCode,
accountNumber,
accountName
}=req.body;


const verifyResponse = await axios.post(

"https://api.flutterwave.com/v3/accounts/resolve",

{
account_number: accountNumber,
account_bank: bankCode
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


// Use verified Flutterwave account name
const verifiedName =
verifyResponse.data.data.account_name;


const beneficiary = await BankBeneficiary.create({
phone,
bankName,
bankCode,
accountNumber,
accountName: verifiedName
});


res.json({
message:"Bank beneficiary saved successfully",
beneficiary
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Get saved beneficiaries
const getBankBeneficiaries = async(req,res)=>{

try{

const beneficiaries = await BankBeneficiary.find({
phone:req.params.phone
});


res.json(beneficiaries);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Send money
const sendMoney = async(req,res)=>{

try{

const {
phone,
beneficiaryId,
pin,
amount
}=req.body;


const wallet = await Wallet.findOne({
phone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}



const userPin = await TransactionPin.findOne({
phone
});


if(!userPin || userPin.pin !== pin){

return res.status(400).json({
message:"Invalid transaction PIN"
});

}



const beneficiary = await BankBeneficiary.findById(
beneficiaryId
);


if(!beneficiary){

return res.status(404).json({
message:"Beneficiary not found"
});

}



const setting = await TransferSetting.findOne();

const fee =
setting && setting.feeEnabled
? Number(setting.transferFee)
: 0;

const total =
Number(amount) + fee;



if(wallet.balance < total){

return res.status(400).json({
message:"Insufficient balance"
});

}



const reference =
"ALPHATRANS-" + Date.now();



const transferResponse =
await axios.post(

"https://api.flutterwave.com/v3/transfers",

{
account_bank: beneficiary.bankCode,

account_number: beneficiary.accountNumber,

amount:Number(amount),

currency:"NGN",

reference,

narration:"AlphaBot Bank Transfer",

beneficiary_name: beneficiary.accountName

},

{
headers:{
Authorization:`Bearer ${process.env.FLW_SECRET_KEY}`,
"Content-Type":"application/json"
}
}

);



if(
!transferResponse.data ||
transferResponse.data.status !== "success"
){

return res.status(400).json({
message:"Transfer failed"
});

}



const before = wallet.balance;


wallet.balance -= total;


await wallet.save();



await Transaction.create({

phone,

type:"bank_transfer",

direction:"debit",

amount:total,

reference,

service:"bank_transfer",

description:`Transfer to ${beneficiary.accountName}`,

balanceBefore:before,

balanceAfter:wallet.balance,

status:"successful"

});



res.json({

message:"Transfer successful",

balance:wallet.balance,

transfer:transferResponse.data

});


}catch(error){

res.status(500).json({
message:
error.response?.data || error.message
});

}

};

module.exports={
addBankBeneficiary,
getBankBeneficiaries,
sendMoney
};
