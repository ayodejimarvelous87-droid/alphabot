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


const formatAmount = (amount) => {
return Number(amount).toLocaleString();
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


// Data purchase failure investigation
if(
lower.includes("data") &&
(
lower.includes("fail") ||
lower.includes("failed") ||
lower.includes("not received") ||
lower.includes("did not get") ||
lower.includes("why")
)
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


if(
latestData.status === "successful" ||
latestData.status === "completed"
){

return `I could not find a failed data purchase. Your latest data purchase of ₦${formatAmount(latestData.amount)} was ${formatStatus(latestData.status)}.`;

}


return `I found your latest data purchase of ₦${formatAmount(latestData.amount)}. Status: ${formatStatus(latestData.status)}.`;

}


// Airtime purchase troubleshooting
if(
lower.includes("airtime") &&
(
lower.includes("fail") ||
lower.includes("failed") ||
lower.includes("not received") ||
lower.includes("did not get") ||
lower.includes("why")
)
){

const airtime = await Transaction.findOne({
phone:user.phone,
type:"airtime"
})
.sort({createdAt:-1});

if(!airtime){
return "I could not find a recent airtime purchase related to this issue.";
}

if(airtime.status === "failed"){
return `Your airtime purchase of ₦${formatAmount(airtime.amount)} failed.\n\nStatus: ${formatStatus(airtime.status)}\n\nIf your wallet was debited and airtime was not received, please check for a refund or contact support.`;
}

if(airtime.status === "successful" || airtime.status === "completed"){
return `I could not find a failed airtime purchase. Your latest airtime purchase of ₦${formatAmount(airtime.amount)} was ${formatStatus(airtime.status)}.`;
}

return `I found your airtime purchase of ₦${formatAmount(airtime.amount)}. Status: ${formatStatus(airtime.status)}.`;

}

// Electricity troubleshooting
if(
lower.includes("electricity") &&
(
lower.includes("fail") ||
lower.includes("failed") ||
lower.includes("token") ||
lower.includes("not received") ||
lower.includes("did not get") ||
lower.includes("why")
)
){

const electricity = await Transaction.findOne({
phone:user.phone,
type:"electricity"
})
.sort({createdAt:-1});

if(!electricity){
return "I could not find a recent electricity payment related to this issue.";
}

if(electricity.status === "failed"){
return `Your electricity payment of ₦${formatAmount(electricity.amount)} failed.\n\nStatus: ${formatStatus(electricity.status)}\n\nIf your wallet was debited and you did not receive a token, please check for a refund or contact support.`;
}

if(electricity.status === "successful" || electricity.status === "completed"){
return `I could not find a failed electricity payment. Your latest electricity payment of ₦${formatAmount(electricity.amount)} was ${formatStatus(electricity.status)}.${electricity.description ? "\n\nDescription: " + electricity.description : ""}`;
}

return `I found your electricity payment of ₦${formatAmount(electricity.amount)}. Status: ${formatStatus(electricity.status)}.`;

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


// Transaction reference lookup
const referenceMatch = message.match(/(DATA|WD|AIRTIME|ELEC|TV|BET|EXAM|FUND|REFUND)-[A-Za-z0-9-]+/i);

if(referenceMatch){


const tx = await Transaction.findOne({
phone:user.phone,
reference:referenceMatch[0].toUpperCase()
});

if(!tx){
return "I could not find a transaction with that reference.";
}

return `Transaction ${tx.reference}\n\nType: ${formatType(tx.type)}\nAmount: ₦${formatAmount(tx.amount)}\nStatus: ${formatStatus(tx.status)}${tx.description ? "\nDescription: " + tx.description : ""}`;

}

// Spending analytics
if(

lower.includes("spent") ||
lower.includes("spending") ||
lower.includes("expense")
){

let serviceType = null;

if(lower.includes("data")) serviceType = "data";
else if(lower.includes("airtime")) serviceType = "airtime";
else if(lower.includes("electricity")) serviceType = "electricity";
else if(lower.includes("tv")) serviceType = "tv";
else if(lower.includes("bet")) serviceType = "betting";


const now = new Date();

const start = new Date(now.getFullYear(), now.getMonth(), 1);
const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
end.setHours(23,59,59,999);


let query = {
phone:user.phone,
direction:"debit",
status:{$in:["successful","completed"]},
createdAt:{$gte:start,$lte:end}
};


if(serviceType){
query.type = serviceType;
}


const transactions = await Transaction.find(query);


const total = transactions.reduce((sum,tx)=>sum + Number(tx.amount || 0),0);


if(!transactions.length){
return `I could not find any spending records for this month${serviceType ? " on " + formatType(serviceType) : ""}.`;
}


return `${serviceType ? "You spent" : "Your total spending this month is"} ₦${formatAmount(total)} across ${transactions.length} transaction${transactions.length > 1 ? "s" : ""}${serviceType ? " on " + formatType(serviceType) : ""}.`;

}


// Transaction amount + service + date lookup
const amountMatch = message.match(/(?:₦|N|NGN)?[ ]?([0-9,]{2,})/i);

if(amountMatch){

const amount = Number(amountMatch[1].replace(/,/g,""));

let serviceType = null;

if(lower.includes("data")) serviceType = "data";
else if(lower.includes("airtime")) serviceType = "airtime";
else if(lower.includes("electricity")) serviceType = "electricity";
else if(lower.includes("tv")) serviceType = "tv";
else if(lower.includes("bet")) serviceType = "betting";
else if(lower.includes("withdraw")) serviceType = "withdrawal";


let query = {
phone:user.phone,
amount:amount
};


if(serviceType){
query.type = serviceType;
}


const now = new Date();

if(lower.includes("yesterday")){

const start = new Date(now);
start.setDate(now.getDate() - 1);
start.setHours(0,0,0,0);

const end = new Date(start);
end.setHours(23,59,59,999);

query.createdAt = {$gte:start,$lte:end};

}


if(lower.includes("today")){

const start = new Date(now);
start.setHours(0,0,0,0);

const end = new Date(now);
end.setHours(23,59,59,999);

query.createdAt = {$gte:start,$lte:end};

}


const transactions = await Transaction.find(query)
.sort({createdAt:-1})
.limit(5);


if(!transactions.length){
return `I could not find a matching transaction of ₦${formatAmount(amount)}${serviceType ? " for " + serviceType : ""}. Please provide the reference, service, or approximate time.`;
}


if(transactions.length > 1 && !serviceType){

const options = transactions.map((tx,index)=>
`${index + 1}. ${formatType(tx.type)} — ₦${formatAmount(tx.amount)} (${formatStatus(tx.status)})`
).join("\n");

return `I found multiple transactions matching ₦${formatAmount(amount)}. Please specify which one you mean:\n\n${options}`;

}


const tx = transactions[0];

return `I found your transaction:\n\nType: ${formatType(tx.type)}\nAmount: ₦${formatAmount(tx.amount)}\nStatus: ${formatStatus(tx.status)}${tx.description ? "\nDescription: " + tx.description : ""}`;


}



// Account summary
if(
lower.includes("account summary") ||
lower.includes("financial summary") ||
lower.includes("account report")
){

const wallet = await Wallet.findOne({
phone:user.phone
});


const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth(), 1);
const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
end.setHours(23,59,59,999);


const transactions = await Transaction.find({
phone:user.phone,
createdAt:{$gte:start,$lte:end}
});


const spending = transactions
.filter(tx => tx.direction === "debit" && ["successful","completed"].includes(tx.status))
.reduce((sum,tx)=>sum + Number(tx.amount || 0),0);



const breakdown = {};

transactions
.filter(tx => tx.direction === "debit" && ["successful","completed"].includes(tx.status))
.forEach(tx => {
breakdown[tx.type] = (breakdown[tx.type] || 0) + Number(tx.amount || 0);
});


const serviceBreakdown = Object.entries(breakdown)
.map(([type,amount]) => `• ${formatType(type)}: ₦${formatAmount(amount)}`)
.join("\n");


const refunds = transactions
.filter(tx => tx.type === "refund")
.reduce((sum,tx)=>sum + Number(tx.amount || 0),0);


const withdrawals = await Withdrawal.find({
phone:user.phone,
createdAt:{$gte:start,$lte:end}
});


return `AlphaBot Account Summary:\n\nWallet Balance: ₦${formatAmount(wallet?.balance || 0)}\n\nThis Month:\n• Total spent: ₦${formatAmount(spending)}\n• Transactions: ${transactions.length}\n• Refunds: ₦${formatAmount(refunds)}\n• Withdrawals: ${withdrawals.length}\n\nService Breakdown:\n${serviceBreakdown || "No spending breakdown available."}`;


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
