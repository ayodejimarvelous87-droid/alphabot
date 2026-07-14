const TransactionPin = require("../models/TransactionPin");
const Electricity = require("../models/Electricity");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");



const payElectricity = async(req,res)=>{


try{


const {
    phone,
    disco,
    meterNumber,
    meterType,
    amount, pin
} = req.body;




if(!phone || !disco || !meterNumber || !amount){

return res.status(400).json({

message:"Phone, disco, meter number and amount are required"

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

"ELECTRIC-" + Date.now();





const electricity = await Electricity.create({

phone,

disco,

meterNumber,

meterType: meterType || "prepaid",

amount:Number(amount),

reference,

status:"pending"

});





await Transaction.create({

phone,

type:"electricity",

direction:"debit",

amount:Number(amount),

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${disco} electricity payment`,

status:"pending"

});





await createNotification(

phone,

"Electricity Payment",

`₦${Number(amount).toLocaleString()} electricity payment request created.`,

"info"

);





res.json({

message:"Electricity payment request created",

electricity,

balance:wallet.balance

});




}catch(error){


res.status(500).json({

message:error.message

});


}


};



module.exports = {

payElectricity

};
