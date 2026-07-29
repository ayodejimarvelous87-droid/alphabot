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
recharge_pin:"Recharge PIN",
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

const failedIntent =
lower.includes("failed") ||
lower.includes("fail") ||
lower.includes("not working") ||
lower.includes("didn't work") ||
lower.includes("did not work") ||
lower.includes("not received") ||
lower.includes("not showing") ||
lower.includes("not reflecting") ||
lower.includes("missing") ||
lower.includes("problem") ||
lower.includes("issue");



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
(
lower.includes("data") ||
lower.includes("bundle") ||
lower.includes("gb") ||
lower.includes("internet")
) &&
failedIntent
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
(
lower.includes("airtime") ||
lower.includes("recharge") ||
lower.includes("top up") ||
lower.includes("topup") ||
lower.includes("credit")
) &&
failedIntent
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
(
lower.includes("electricity") ||
lower.includes("light") ||
lower.includes("token") ||
lower.includes("meter") ||
lower.includes("nepa") ||
lower.includes("phcn") ||
lower.includes("unit")
) &&
failedIntent
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



// TV subscription troubleshooting
if(
(
lower.includes("tv") ||
lower.includes("dstv") ||
lower.includes("gotv") ||
lower.includes("decoder") ||
lower.includes("subscription") ||
lower.includes("renew")
) &&
failedIntent
){

const tv = await Transaction.findOne({
phone:user.phone,
type:"tv"
})
.sort({createdAt:-1});

if(!tv){
return "I could not find a recent TV subscription payment related to this issue.";
}

if(tv.status === "failed"){
return `Your TV subscription payment of ₦${formatAmount(tv.amount)} failed.\n\nStatus: ${formatStatus(tv.status)}\n\nIf your wallet was debited and your subscription was not activated, please check for a refund or contact support.`;
}

if(tv.status === "successful" || tv.status === "completed"){
return `I could not find a failed TV subscription payment. Your latest TV subscription payment of ₦${formatAmount(tv.amount)} was ${formatStatus(tv.status)}.${tv.description ? "\n\nDescription: " + tv.description : ""}`;
}

return `I found your TV subscription payment of ₦${formatAmount(tv.amount)}. Status: ${formatStatus(tv.status)}.`;

}


// Exam PIN troubleshooting
if(
lower.includes("exam") ||
lower.includes("waec") ||
lower.includes("neco") ||
lower.includes("result checker") ||
lower.includes("exam pin")
){

const exam = await Transaction.findOne({
phone:user.phone,
type:"exam_pin"
})
.sort({createdAt:-1});

if(!exam){
return "I could not find a recent Exam PIN transaction related to this issue.";
}

if(exam.status === "failed"){
return `Your Exam PIN purchase of ₦${formatAmount(exam.amount)} failed. If your wallet was debited, please check for a refund or contact support.`;
}

if(exam.status === "successful" || exam.status === "completed"){
return `I could not find a failed Exam PIN purchase. Your latest Exam PIN purchase of ₦${formatAmount(exam.amount)} was ${formatStatus(exam.status)}.${exam.description ? "\n\nDescription: " + exam.description : ""}`;
}

return `I found your Exam PIN purchase of ₦${formatAmount(exam.amount)}. Status: ${formatStatus(exam.status)}.`;

}


// Recharge PIN troubleshooting
if(
lower.includes("epin") ||
lower.includes("e pin") ||
lower.includes("recharge pin") ||
lower.includes("recharge code") ||
lower.includes("pin not received") ||
lower.includes("where is my pin")
){

const epin = await Transaction.findOne({
phone:user.phone,
type:"recharge_pin"
})
.sort({createdAt:-1});

if(!epin){
return "I could not find a recent Recharge PIN transaction related to this issue.";
}

if(epin.status === "failed"){
return `Your Recharge PIN purchase of ₦${formatAmount(epin.amount)} failed. If your wallet was debited, please check for a refund or contact support.`;
}

if(epin.status === "successful" || epin.status === "completed"){
return `I found your Recharge PIN purchase of ₦${formatAmount(epin.amount)}. Status: ${formatStatus(epin.status)}.${epin.description ? "\n\nDescription: " + epin.description : ""}`;
}

return `I found your Recharge PIN order of ₦${formatAmount(epin.amount)}. Status: ${formatStatus(epin.status)}.`;

}



 // Betting troubleshooting
 if(
 lower.includes("betting") ||
 lower.includes("bet account") ||
 lower.includes("bet wallet") ||
 lower.includes("fund my bet") ||
 lower.includes("sports betting")
 ){


const betting = await Transaction.findOne({
phone:user.phone,
type:"betting"
})
.sort({createdAt:-1});

if(!betting){
return "I could not find a recent betting transaction related to this issue.";
}

if(betting.status === "failed"){
return `Your betting funding of ₦${formatAmount(betting.amount)} failed. If your wallet was debited, please check for a refund or contact support.`;
}

if(betting.status === "successful" || betting.status === "completed"){
return `I could not find a failed betting transaction. Your latest betting funding of ₦${formatAmount(betting.amount)} was ${formatStatus(betting.status)}.${betting.description ? "\n\nDescription: " + betting.description : ""}`;
}

return `I found your betting transaction of ₦${formatAmount(betting.amount)}. Status: ${formatStatus(betting.status)}.`;

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


// Withdrawal troubleshooting
if(
lower.includes("withdrawal") ||
lower.includes("withdraw") ||
lower.includes("cashout") ||
lower.includes("cash out") ||
lower.includes("payout") ||
lower.includes("comot") ||
lower.includes("take out")
){

const wd = await Withdrawal.findOne({
phone:user.phone
})
.sort({createdAt:-1});

if(!wd){
return "You don't have any withdrawal requests.";
}

if(wd.status === "failed"){
return `Your withdrawal of ₦${formatAmount(wd.amount)} failed.\n\nStatus: ${formatStatus(wd.status)}\n\nPlease check your wallet and contact support if the amount was deducted.`;
}

if(wd.status === "pending"){
return `Your withdrawal of ₦${formatAmount(wd.amount)} is currently Pending.\n\nIt is waiting for processing. Please contact support if it takes longer than expected.`;
}

if(wd.status === "successful" || wd.status === "completed"){
return `Your withdrawal of ₦${formatAmount(wd.amount)} was ${formatStatus(wd.status)}.`;
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
 // Refund tracking
 if(
 lower.includes("refund") ||
 lower.includes("refunded") ||
 lower.includes("money back")
 ){

 const failedTransaction = await Transaction.findOne({
 phone:user.phone,
 status:"failed"
 })
 .sort({createdAt:-1});

 if(!failedTransaction){
 return "I could not find any failed transaction linked to a refund."; 
 }

 const refund = await Transaction.findOne({
 phone:user.phone,
 type:"refund",
 originalReference:failedTransaction.reference
 });

 if(!refund){
 return "I found your failed transaction, but I could not find a matching refund record yet.";
 }

 return `Your failed ${formatType(failedTransaction.type)} transaction of ₦${formatAmount(failedTransaction.amount)} has a refund of ₦${formatAmount(refund.amount)}. Refund status: ${formatStatus(refund.status)}.`;

 }
// Wallet funding troubleshooting
if(
(
lower.includes("fund") ||
lower.includes("deposit") ||
lower.includes("top up") ||
lower.includes("topup") ||
lower.includes("added money") ||
lower.includes("add money") ||
lower.includes("put money") ||
lower.includes("sent money") ||
lower.includes("transferred") ||
lower.includes("wallet not credited") ||
lower.includes("balance not updated")
) &&
failedIntent
){

const fund = await Transaction.findOne({
phone:user.phone,
type:"fund"
})
.sort({createdAt:-1});

if(!fund){
return "I could not find any recent wallet funding transaction on your account.";
}

if(fund.status === "failed"){
return `Your wallet funding of ₦${formatAmount(fund.amount)} failed. Please try again or use another payment method.`;
}

if(fund.status === "pending"){
return `Your wallet funding of ₦${formatAmount(fund.amount)} is still Pending. Please wait while the payment is confirmed.`;
}

if(fund.status === "successful" || fund.status === "completed"){
return `Your wallet funding of ₦${formatAmount(fund.amount)} was successful and has been credited to your wallet.${fund.reference ? "\n\nReference: " + fund.reference : ""}`;
}

return `I found your wallet funding of ₦${formatAmount(fund.amount)}. Status: ${formatStatus(fund.status)}.`;

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
