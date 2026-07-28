const User = require("../models/User");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const Withdrawal = require("../models/Withdrawal");


const getAIContext = async (phone, message="") => {

try {

const user = await User.findOne({phone});


const wallet = await Wallet.findOne({phone});


const lowerMessage = message.toLowerCase();

let transactionType = null;

if(lowerMessage.includes("data")){
transactionType = "data";
}
else if(lowerMessage.includes("airtime")){
transactionType = "airtime";
}
else if(lowerMessage.includes("electricity")){
transactionType = "electricity";
}
else if(lowerMessage.includes("tv")){
transactionType = "tv";
}
else if(lowerMessage.includes("withdraw")){
transactionType = "withdrawal";
}
else if(lowerMessage.includes("bet")){
transactionType = "betting";
}
else if(
lowerMessage.includes("exam") ||
lowerMessage.includes("epin")
){
transactionType = "exam_pin";
}


let transactions;

if(transactionType){

transactions = await Transaction.find({
phone,
type:transactionType
})
.sort({createdAt:-1})
.limit(5);

}else{

transactions = await Transaction.find({phone})
.sort({createdAt:-1})
.limit(5);

}


const withdrawal = await Withdrawal.findOne({phone})
.sort({createdAt:-1});


return {

name:user?.name || "User",

walletBalance: wallet?.balance || 0,


recentTransactions:
transactions.map(tx=>({
type:tx.type,
amount:tx.amount,
status:tx.status,
service:tx.service,
description:tx.description,
createdAt:tx.createdAt
})),


latestWithdrawal: withdrawal ? {
amount:withdrawal.amount,
status:withdrawal.status,
reference:withdrawal.reference
}:null

};


}catch(error){

console.log(
"AI Context Error:",
error.message
);

return {};

}

};


module.exports = {
getAIContext
};
