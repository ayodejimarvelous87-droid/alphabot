const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const Withdrawal = require("../models/Withdrawal");
const { getAIReply } = require("./aiService");


const formatType = (type) => {

const names = {
fund:"Wallet funding",
purchase:"Purchase",
airtime:"Airtime purchase",
data:"Data purchase",
airtime_cash:"Airtime to cash",
electricity:"Electricity payment",
tv:"TV subscription",
betting:"Betting funding",
exam_pin:"Exam PIN",
withdrawal:"Withdrawal",
refund:"Refund",
recurring:"Recurring payment"
};

return names[type] || type;
};


const formatStatus = (status) => {

const statuses = {
successful:"Successful",
completed:"Successful",
pending:"Pending",
failed:"Failed"
};

return statuses[status] || status;
};

const formatAmount = (amount) => {
return Number(amount).toLocaleString();
};


const getAIResponse = async (message, user = {}) => {

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

return `Your current AlphaBot wallet balance is ₦${formatAmount(wallet?.balance || 0)}.`;

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
`${index + 1}. ${formatType(tx.type)} — ₦${formatAmount(tx.amount)}
   Status: ${formatStatus(tx.status)}`
).join("\n\n");


return `Here are your last 3 transactions:\n\n${list}`;

}


// Data purchase failure investigation
if(
(lower.includes("data") && (
lower.includes("fail") ||
lower.includes("failed") ||
lower.includes("not received") ||
lower.includes("did not get") ||
lower.includes("why")
))
){

const dataTransactions = await Transaction.find({
phone:user.phone,
type:"data"
})
.sort({createdAt:-1})
.limit(5);


if(!dataTransactions.length){

return "I could not find any recent data purchase matching this issue. Please provide the amount or approximate time of the transaction.";

}


const latestData = dataTransactions[0];


if(latestData.status === "failed"){

const refund = await Transaction.findOne({
phone:user.phone,
type:"refund",
description:/data/i
})
.sort({createdAt:-1});


if(refund){
return `Your data purchase of ₦${formatAmount(latestData.amount)} failed. A refund of ₦${formatAmount(refund.amount)} has been processed to your wallet.`;
}

return `Your data purchase of ₦${formatAmount(latestData.amount)} failed. It is currently being reviewed.`;

}


if(latestData.status === "successful" || latestData.status === "completed"){

return `I could not find a failed data purchase. Your latest data purchase of ₦${formatAmount(latestData.amount)} was ${formatStatus(latestData.status)}.`;

}


return `I found your latest data purchase of ₦${formatAmount(latestData.amount)}. Status: ${formatStatus(latestData.status)}.`;

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


return `Your last transaction was ${formatType(tx.type)} of ₦${formatAmount(tx.amount)}. Status: ${formatStatus(tx.status)}.`;

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


return `Your latest withdrawal of ₦${formatAmount(wd.amount)} is currently ${formatStatus(wd.status)}.`;

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
