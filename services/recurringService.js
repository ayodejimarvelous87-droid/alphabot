const Recurring = require("../models/Recurring");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("./notificationService");
const { purchaseProduct } = require("./vtuService");
const Product = require("../models/Product");


const processRecurringPayments = async()=>{

try{

const payments = await Recurring.find({

status:"active",

nextRun:{
$lte:new Date()
}

});


for(const payment of payments){


const wallet = await Wallet.findOne({

phone:payment.phone

});


if(!wallet){

continue;

}



if(wallet.balance < payment.amount){

await createNotification(
payment.phone,
"Recurring Payment Failed",
"Insufficient wallet balance for recurring payment.",
"error"
);

continue;

}




let result = {
success:true
};



if(payment.service === "data" && payment.productId){


const product = await Product.findById(
payment.productId
);


if(product){

result = await purchaseProduct(
payment.phone,
product
);

}

}



if(!result.success){

continue;

}



const before = wallet.balance;


wallet.balance -= payment.amount;


await wallet.save();



await Transaction.create({

phone:payment.phone,

type:"recurring",

direction:"debit",

amount:payment.amount,

balanceBefore:before,

balanceAfter:wallet.balance,

description:"Recurring "+payment.service,

status:"successful"

});



await createNotification(

payment.phone,

"Recurring Payment Successful",

`${payment.service} recurring payment completed.`,

"success"

);



// update next run

if(payment.frequency==="daily"){

payment.nextRun.setDate(
payment.nextRun.getDate()+1
);

}

if(payment.frequency==="weekly"){

payment.nextRun.setDate(
payment.nextRun.getDate()+7
);

}

if(payment.frequency==="monthly"){

payment.nextRun.setMonth(
payment.nextRun.getMonth()+1
);

}


await payment.save();


}


}catch(error){

console.log(
"Recurring error:",
error.message
);

}


};


module.exports={
processRecurringPayments
};
