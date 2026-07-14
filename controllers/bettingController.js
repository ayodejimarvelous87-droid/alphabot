const TransactionPin = require("../models/TransactionPin");
const Betting = require("../models/Betting");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");


// Betting funding

const fundBetting = async(req,res)=>{


try{


const {
    phone,
    provider,
    customerId,
    amount, pin
} = req.body;




if(!phone || !provider || !customerId || !amount){

return res.status(400).json({

message:"Phone, provider, customer ID and amount are required"

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

"BET-" + Date.now();





const betting = await Betting.create({

phone,

provider,

customerId,

amount:Number(amount),

reference,

status:"pending"

});






await Transaction.create({

phone,

type:"betting",

direction:"debit",

amount:Number(amount),

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${provider} betting funding`,

status:"pending"

});






await createNotification(

phone,

"Betting Funding",

`₦${Number(amount).toLocaleString()} betting funding request created.`,

"info"

);






res.json({

message:"Betting funding request created",

betting,

balance:wallet.balance

});




}catch(error){


res.status(500).json({

message:error.message

});


}


};



module.exports = {

fundBetting

};
