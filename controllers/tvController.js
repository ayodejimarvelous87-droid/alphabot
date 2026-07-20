const TransactionPin = require("../models/TransactionPin");
const TVSubscription = require("../models/TVSubscription");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");

const {
verifyCustomer,
purchaseTV
} = require("../services/vtuService");



const subscribeTV = async(req,res)=>{

try{


const {
provider,
smartCardNumber,
variation_id,
amount,
pin
}=req.body;


const phone = normalizePhone(req.user.phone);



if(!provider || !smartCardNumber || !variation_id || !amount || !pin){

return res.status(400).json({
message:"Provider, smart card, package, amount and PIN required"
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



const verify = await verifyCustomer({

customer_id:smartCardNumber,

service_id:provider

});



if(!verify || verify.code !== "success"){

return res.status(400).json({

message:"Smart card verification failed",

verify

});

}



const reference = "TV-" + Date.now();



const providerResponse = await purchaseTV({

customer_id:smartCardNumber,

service_id:provider,

variation_id,

request_id:reference

});



if(!providerResponse || providerResponse.code !== "success"){

return res.status(400).json({

message:"TV subscription failed",

providerResponse

});

}



const balanceBefore = wallet.balance;


wallet.balance -= Number(amount);


await wallet.save();



const subscription = await TVSubscription.create({

phone,

provider,

smartCardNumber,

package:variation_id,

amount:Number(amount),

reference,

status:"successful"

});



await Transaction.create({

phone,

type:"tv",

direction:"debit",

amount:Number(amount),

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${provider} TV subscription`,

status:"successful"

});



await createNotification(

phone,

"TV Subscription Successful",

`${provider} subscription completed.`,

"success"

);



res.json({

message:"TV subscription successful",

subscription,

balance:wallet.balance,

providerResponse

});



}catch(error){

console.log(
"TV error:",
error.response?.data || error.message
);


res.status(500).json({

message:error.response?.data || error.message

});

}

};



module.exports={
subscribeTV
};
