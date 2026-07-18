const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const Prediction = require("../models/Prediction");
const FootballReward = require("../models/FootballReward");
const getCurrentWeek = require("../utils/getCurrentWeek");



// Admin leaderboard
router.get("/leaderboard", auth, admin, async(req,res)=>{

try{

const leaderboard = await Prediction.aggregate([

{
$match:{
week:getCurrentWeek()
}
},

{
$group:{
_id:"$userId",
points:{
$sum:"$points"
}
}
},

{
$sort:{
points:-1
}
}

]);


res.json(leaderboard);


}catch(error){

res.status(500).json({
message:error.message
});

}

});




// Admin all rewards
router.get("/rewards", auth, admin, async(req,res)=>{

try{

const rewards = await FootballReward.find()
.populate("userId","name phone")
.sort({createdAt:-1});


res.json(rewards);


}catch(error){

res.status(500).json({
message:error.message
});

}

});




// Admin create reward manually
router.post("/reward", auth, admin, async(req,res)=>{

try{

const {
userId,
position,
rewardType,
amount,
dataAmount
}=req.body;

const newReward = await FootballReward.create({

userId,

position,

rewardType,

amount,

dataAmount,

week:getCurrentWeek()

});


res.json({

message:"Football reward created",

reward:newReward

});


}catch(error){

res.status(500).json({
message:error.message
});

}

});



module.exports = router;
