const express = require("express");
const router = express.Router();

const FootballReward = require("../models/FootballReward");
const Notification = require("../models/Notification");
const User = require("../models/User");


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

reward:reward.reward,

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




// Claim reward
router.post("/claim/:id", async(req,res)=>{

try{

const reward = await FootballReward.findById(
req.params.id
);


if(!reward){

return res.status(404).json({
message:"Reward not found"
});

}



if(reward.status !== "pending"){

return res.status(400).json({
message:"Reward already claimed"
});

}



const user = await User.findById(
reward.userId
);


if(!user){

return res.status(404).json({
message:"User not found"
});

}



reward.status="claimed";

await reward.save();



await Notification.create({

phone:user.phone,

title:"Football Reward 🎉",

message:
`Congratulations! You won ${reward.reward} in this week's football prediction competition. Your reward has been approved.`,

type:"football"

});



res.json({

message:"Reward claimed successfully",

reward

});


}catch(error){

res.status(500).json({
message:error.message
});

}

});


module.exports = router;
