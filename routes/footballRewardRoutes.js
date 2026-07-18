const express = require("express");
const router = express.Router();

const FootballReward = require("../models/FootballReward");




// Get user football rewards history
router.get("/:userId", async(req,res)=>{

try{

const rewards = await FootballReward.find({
userId:req.params.userId
})
.sort({createdAt:-1});


res.json(
rewards.map(reward=>({

position:reward.position,

rewardType:reward.rewardType,

amount:reward.amount,

dataAmount:reward.dataAmount,

week:reward.week,

status:reward.status,

date:reward.createdAt

}))
);


}catch(error){

res.status(500).json({
message:error.message
});

}

});






module.exports = router;
