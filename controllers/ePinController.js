const EPin = require("../models/EPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { purchaseEPins } = require("../services/vtuService");
const { createNotification } = require("../services/notificationService");

const normalizePhone = (phone)=>{

if(!phone) return phone;

phone = phone.replace(/\s+/g,"");

if(phone.startsWith("0")){
return "+234" + phone.slice(1);
}

return phone;

};


const buyEPin = async(req,res)=>{

try{

const {
phone,
network,
amount,
quantity
}=req.body;


const cleanPhone = normalizePhone(phone);


if(!cleanPhone || !network || !amount || !quantity){

return res.status(400).json({
message:"Phone, network, amount and quantity are required"
});

}


const buyerPhone = normalizePhone(req.user.phone);

const wallet = await Wallet.findOne({
phone:buyerPhone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}


const total =
Number(amount) * Number(quantity);


if(wallet.balance < total){

return res.status(400).json({
message:"Insufficient wallet balance"
});

}


const balanceBefore = wallet.balance;


const reference =
"EPIN-" + Date.now();



const apiResponse = await purchaseEPins({

network,
amount:Number(amount),
quantity:Number(quantity),
request_id:reference

});
console.log("EPIN VTU RESPONSE:", JSON.stringify(apiResponse,null,2));



const epinList = apiResponse.data?.epins || apiResponse.data?.pins || apiResponse.epins || apiResponse.pins || [];

const pins = epinList.map(p => typeof p === "string" ? p : p.pin);

const orderId = apiResponse.data?.order_id || null;

const epinStatus = pins.length > 0 ? "successful" : "processing";

wallet.balance -= total;

await wallet.save();

const epin = await EPin.create({

phone:cleanPhone,

network,

amount:Number(amount),

quantity:Number(quantity),

pins,

reference,

order_id:orderId,

status:epinStatus

});




await Transaction.create({

phone:cleanPhone,

type:"epin",

direction:"debit",

amount:total,

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${network} recharge PIN purchase`,

status:"successful"

});



await createNotification(

cleanPhone,

"ePIN Purchase",

epinStatus === "successful"
? `${network} recharge PIN generated successfully`
: `${network} recharge PIN order is processing`,

epinStatus === "successful" ? "success" : "info"

);





res.json({

message:"ePIN purchase successful",

epin,

balance:wallet.balance

});


}catch(error){

console.log(
"EPIN ERROR:",
error.response?.data || error.message
);


res.status(500).json({

message:error.response?.data?.message || error.message

});

}

};


module.exports={
buyEPin
};
