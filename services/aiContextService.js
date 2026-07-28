const User = require("../models/User");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const Withdrawal = require("../models/Withdrawal");


const getAIContext = async (phone) => {

try {

const user = await User.findOne({phone});


const wallet = await Wallet.findOne({phone});


const transactions = await Transaction.find({phone})
.sort({createdAt:-1})
.limit(5);


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
