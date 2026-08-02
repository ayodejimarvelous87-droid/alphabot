const AirtimeCash = require("../models/AirtimeCash");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("./notificationService");


const approveAirtimeCash = async(id)=>{

const request = await AirtimeCash.findById(id);


if(!request){
throw new Error("Request not found");
}


if(request.status !== "pending"){
throw new Error("Already processed");
}


const wallet = await Wallet.findOne({
phone:request.phone
});


if(!wallet){
throw new Error("Wallet not found");
}


const balanceBefore = wallet.balance;


wallet.balance += request.cashAmount;


await wallet.save();


await Transaction.create({

phone:request.phone,

type:"airtime_cash",

direction:"credit",

amount:request.cashAmount,

balanceBefore,

balanceAfter:wallet.balance,

description:"Airtime To Cash Conversion",

status:"successful",

reference:request.reference

});


request.status="approved";

await request.save();


await createNotification(

request.phone,

"Airtime To Cash Approved",

`₦${request.cashAmount.toLocaleString()} has been added to your AlphaBot wallet.`,

"success"

);


return wallet;

};


module.exports={
approveAirtimeCash
};
