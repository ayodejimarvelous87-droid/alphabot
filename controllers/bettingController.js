const TransactionPin = require("../models/TransactionPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");

const {
verifyCustomer,
purchaseBetting
} = require("../services/vtuService");


const fundBetting = async(req,res)=>{

try{

const {
customer_id,
service_id,
amount,
pin
}=req.body;


const phone = normalizePhone(req.user.phone);


if(!customer_id || !service_id || !amount || !pin){

return res.status(400).json({
message:"Customer ID, service, amount and PIN required"
});

}



const userPin = await TransactionPin.findOne({
phone
});


if(!userPin){

return res.status(400).json({
message:"Create transaction PIN first"
});

}


if(userPin.pin !== pin){

return res.status(400).json({
message:"Incorrect transaction PIN"
});

}



const wallet = await Wallet.findOne({
phone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}



if(wallet.balance < Number(amount)){

return res.status(400).json({
message:"Insufficient wallet balance"
});

}



const verifyResponse = await verifyCustomer({

customer_id,
service_id

});



if(
!verifyResponse ||
verifyResponse.code !== "success"
){

return res.status(400).json({
message:"Bet account verification failed",
verifyResponse
});

}




const reference = "BET-" + Date.now();



const providerResponse = await purchaseBetting({

customer_id,
service_id,
amount,
request_id:reference

});



if(
!providerResponse ||
providerResponse.code !== "success"
){

return res.status(400).json({
message:"Bet funding failed",
providerResponse
});

}



const balanceBefore = wallet.balance;


wallet.balance -= Number(amount);


await wallet.save();



await Transaction.create({

phone,

type:"betting",

direction:"debit",

amount:Number(amount),

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${service_id} betting funding`,

status:"successful"

});



await createNotification(

phone,

"Betting Account Funded",

`₦${Number(amount).toLocaleString()} added to ${service_id}.`,

"success"

);



res.json({

message:"Betting funding successful",

balance:wallet.balance,

providerResponse

});


}catch(error){

console.log(
"Betting error:",
error.response?.data || error.message
);


res.status(500).json({
message:error.response?.data || error.message
});

}

};



module.exports={
fundBetting
};
