const TransactionPin = require("../models/TransactionPin");
const Airtime = require("../models/Airtime");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");


// Buy airtime

const buyAirtime = async(req,res)=>{

try{


const { phone, network, amount, pin } = req.body;



if(!phone || !network || !amount){

return res.status(400).json({

message:"Phone, network and amount are required"

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




const balanceBefore = wallet.balance;



wallet.balance -= Number(amount);



await wallet.save();





const reference =

"AIRTIME-" + Date.now();





const airtime = await Airtime.create({

phone,

network,

amount:Number(amount),

reference,

status:"successful"

});





await Transaction.create({

phone,

type:"airtime",

 direction:"debit",

amount:Number(amount),

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${network} airtime purchase`,

status:"successful"

});







const cashback = Math.floor(Number(amount) * 0.005);


if(cashback > 0){

const cashbackBefore = wallet.balance;

wallet.balance += cashback;

await wallet.save();


await Transaction.create({

phone,

type:"cashback",

direction:"credit",

amount:cashback,

reference,

balanceBefore:cashbackBefore,

balanceAfter:wallet.balance,

description:"Airtime cashback reward",

status:"successful"

});

}


await createNotification(

phone,

"Airtime Purchase Successful",

`₦${Number(amount).toLocaleString()} ${network} airtime purchased.`,

"success"

);





res.json({

message:"Airtime purchase successful",

airtime,

balance:wallet.balance

});





}catch(error){


res.status(500).json({

message:error.message

});


}


};





module.exports={

buyAirtime

};
