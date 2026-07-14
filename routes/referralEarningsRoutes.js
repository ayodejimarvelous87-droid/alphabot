const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Transaction = require("../models/Transaction");


// Referral earnings history
router.get("/:phone", async(req,res)=>{

try{

const user = await User.findOne({
phone:req.params.phone
});


if(!user){

return res.status(404).json({
message:"User not found"
});

}


const earnings = await Transaction.find({

phone:req.params.phone,
type:"referral_reward"

}).sort({
createdAt:-1
});


res.json({

totalEarnings:user.referralEarnings || 0,

history:earnings

});


}catch(error){

res.status(500).json({
message:error.message
});

}

});


module.exports = router;
