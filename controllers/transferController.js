const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const TransactionPin = require("../models/TransactionPin");
const BankBeneficiary = require("../models/BankBeneficiary");


// Add bank beneficiary
const addBankBeneficiary = async(req,res)=>{

try{

const {
phone,
bankName,
accountNumber,
accountName
}=req.body;


const beneficiary = await BankBeneficiary.create({
phone,
bankName,
accountNumber,
accountName
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

const userPin = await TransactionPin.findOne({phone});

if(!userPin || userPin.pin !== pin){
return res.status(400).json({
message:"Invalid transaction PIN"
});
}


const fee = 10;
const total = Number(amount) + fee;


if(wallet.balance < total){

return res.status(400).json({
message:"Insufficient balance"
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


const before = wallet.balance;


wallet.balance -= total;

await wallet.save();


await Transaction.create({

phone,

type:"bank_transfer",

direction:"debit",

amount:total,

service:"bank_transfer",

description:`Transfer to ${beneficiary.accountName}`,

balanceBefore:before,

balanceAfter:wallet.balance

});


res.json({

message:"Transfer successful",

balance:wallet.balance

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports={
addBankBeneficiary,
getBankBeneficiaries,
sendMoney
};
