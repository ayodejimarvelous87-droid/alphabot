const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const Withdrawal = require("../models/Withdrawal");
const { getAIReply } = require("./aiService");


const getAIResponse = async (message, user = {}) => {
console.log("AI ROUTER ACTIVE:", message);

const lower = message.toLowerCase();


// Wallet balance
if(
lower.includes("wallet balance") ||
lower.includes("my balance") ||
lower.includes("account balance") ||
lower === "balance"
){

const wallet = await Wallet.findOne({
phone:user.phone
});

return `Your current AlphaBot wallet balance is ₦${wallet?.balance || 0}.`;

}


// Last 3 transactions
if(
lower.includes("last 3 transactions") ||
lower.includes("last three transactions") ||
lower.includes("recent transactions")
){

const transactions = await Transaction.find({
phone:user.phone
})
.sort({createdAt:-1})
.limit(3);


if(!transactions.length){

return "You don't have any transactions yet.";

}


const list = transactions.map((tx,index)=>
`${index + 1}. ${tx.type} - ₦${tx.amount} (${tx.status})`
).join("\n");


return `Here are your last 3 transactions:\n\n${list}`;

}


// Last transaction
if(
lower.includes("last transaction") ||
lower.includes("recent transaction")
){

const tx = await Transaction.findOne({
phone:user.phone
})
.sort({createdAt:-1});


if(!tx){

return "You don't have any transactions yet.";

}


return `Your last transaction was a ${tx.type} transaction of ₦${tx.amount}. Status: ${tx.status}.`;

}


// Withdrawal status
if(
lower.includes("withdrawal status") ||
lower.includes("my withdrawal")
){

const wd = await Withdrawal.findOne({
phone:user.phone
})
.sort({createdAt:-1});


if(!wd){

return "You don't have any withdrawal requests.";

}


return `Your latest withdrawal of ₦${wd.amount} is currently ${wd.status}.`;

}


// Everything else goes to AI
return await getAIReply(
message,
user
);

};


module.exports = {
getAIResponse
};
