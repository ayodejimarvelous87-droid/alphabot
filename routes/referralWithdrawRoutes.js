const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const User = require("../models/User");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");


// Withdraw referral earnings to wallet

router.post("/", auth, async(req,res)=>{

try{


const phone = req.user.phone;


const user = await User.findOne({
phone
});


if(!user){

return res.status(404).json({
message:"User not found"
});

}



const earnings = Number(user.referralEarnings || 0);



if(earnings < 200){

return res.status(400).json({
message:"Minimum referral withdrawal is ₦200"
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




const balanceBefore = wallet.balance;



wallet.balance += earnings;



await wallet.save();





user.referralEarnings = 0;



await user.save();






await Transaction.create({

phone,

type:"referral_reward",

direction:"credit",

amount:earnings,

balanceBefore,

balanceAfter:wallet.balance,

description:"Referral earnings withdrawal",

status:"successful"

});





res.json({

message:"Referral earnings added to wallet",

amount:earnings,

balance:wallet.balance

});




}catch(error){


res.status(500).json({

message:error.message

});

}


});



module.exports = router;
