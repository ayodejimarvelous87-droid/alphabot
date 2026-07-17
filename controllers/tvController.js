const TransactionPin = require("../models/TransactionPin");
const TVSubscription = require("../models/TVSubscription");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");



const subscribeTV = async(req,res)=>{


try{


const {

phone,

provider,

smartCardNumber,

package,
pin,

amount

} = req.body;




if(!phone || !provider || !smartCardNumber || !package || !amount){


return res.status(400).json({

message:"Phone, provider, smart card number, package and amount are required"

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

"TV-" + Date.now();





const subscription = await TVSubscription.create({

phone,

provider,

smartCardNumber,

package,
pin,

amount:Number(amount),

reference,

status:"pending"

});






await Transaction.create({

phone,

type:"tv",

direction:"debit",

amount:Number(amount),

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${provider} ${package} subscription`,

status:"pending"

});






await createNotification(

phone,

"TV Subscription",

`${provider} subscription request created.`,

"info"

);






res.json({

message:"TV subscription request created",

subscription,

balance:wallet.balance

});





}catch(error){


res.status(500).json({

message:error.message

});


}


};



module.exports = {

subscribeTV

};
