const User = require("../models/User");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const Profit = require("../models/Profit");
const oplugService = require("../services/oplugService");
const blitzPayService = require("../services/blitzPayService");
const vtuService = require("../services/vtuService");

const getDashboard = async(req,res)=>{

try{

const startToday = new Date();
startToday.setHours(0,0,0,0);

const startMonth = new Date(
startToday.getFullYear(),
startToday.getMonth(),
1
);


const totalUsers = await User.countDocuments();


let masterWallet = {
  oplug: 0,
  blitzpay: 0,
  vtu: 0
};


// Oplug balance
try {

  const balance = await oplugService.getBalance();

  masterWallet.oplug =
    Number(
      balance.user?.wallet ??
      balance.wallet ??
      balance.data?.balance ??
      0
    );

} catch(error){

  console.log(
    "OPLUG BALANCE ERROR:",
    error.message
  );

}


// BlitzPay balance
try {

  const balance = await blitzPayService.getBalance();

  masterWallet.blitzpay =
    Number(
      balance.data?.balance ||
      balance.balance ||
      0
    );

} catch(error){

  console.log(
    "BLITZPAY BALANCE ERROR:",
    error.message
  );

}



  // VTU balance
  try {

    const balance = await vtuService.getBalance();

    console.log(
      "VTU DASHBOARD BALANCE RESPONSE:",
      balance
    );

    masterWallet.vtu =
      Number(
        balance.data?.balance ||
        balance.balance ||
        0
      );

  } catch(error){

    console.log(
      "VTU BALANCE ERROR:",
      error.message
    );

  }


const wallets = await Wallet.find();

const walletBalance = wallets.reduce(
(sum,item)=>sum + Number(item.balance || 0),
0
);


const todayTransactions = await Transaction.find({
createdAt:{
$gte:startToday
}
});


const todaySales = todayTransactions
.filter(item=>item.direction==="debit")
.reduce(
(sum,item)=>sum + Number(item.amount || 0),
0
);


const todayProfit = await Profit.find({
createdAt:{
$gte:startToday
}
});


const monthProfit = await Profit.find({
createdAt:{
$gte:startMonth
}
});


const todayProfitAmount = todayProfit.reduce(
(sum,item)=>sum + Number(item.profit || 0),
0
);


const monthProfitAmount = monthProfit.reduce(
(sum,item)=>sum + Number(item.profit || 0),
0
);


const serviceMap={};

monthProfit.forEach(item=>{

serviceMap[item.service]=
(serviceMap[item.service] || 0)
+
Number(item.profit || 0);

});


let bestService="N/A";
let highest=-1;

Object.entries(serviceMap).forEach(([service,value])=>{

if(value>highest){

highest=value;
bestService=service;

}

});


const recentTransactions =
await Transaction.find()
.sort({createdAt:-1})
.limit(10);



const salesChart=[];

const profitChart=[];


for(let i=6;i>=0;i--){

const day=new Date();

day.setDate(day.getDate()-i);

day.setHours(0,0,0,0);


const nextDay=new Date(day);

nextDay.setDate(day.getDate()+1);



const sales = await Transaction.find({
createdAt:{
$gte:day,
$lt:nextDay
},
direction:"debit"
});


const profits = await Profit.find({
createdAt:{
$gte:day,
$lt:nextDay
}
});


salesChart.push({

date:day.toLocaleDateString("en-US",{
month:"short",
day:"numeric"
}),

amount:sales.reduce(
(sum,item)=>sum+Number(item.amount||0),
0
)

});


profitChart.push({

date:day.toLocaleDateString("en-US",{
month:"short",
day:"numeric"
}),

amount:profits.reduce(
(sum,item)=>sum+Number(item.profit||0),
0
)

});

}


const serviceChart = Object.entries(serviceMap)
.map(([service,amount])=>({
service,
amount
}));



res.json({

totalUsers,

walletBalance,

masterWallet,

todaySales,

todayProfit:todayProfitAmount,

monthProfit:monthProfitAmount,

bestService,

salesChart,

profitChart,

serviceChart,

recentTransactions

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};

module.exports={
getDashboard
};
