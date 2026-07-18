const express = require("express");
const router = express.Router();

const FootballMatch = require("../models/FootballMatch");
const Prediction = require("../models/Prediction");
const getCurrentWeek = require("../utils/getCurrentWeek");


// Get matches
router.get("/matches", async(req,res)=>{

try{

const matches = await FootballMatch.find({
status:"Not Started",
matchDate:{
$gt:new Date()
}
})
.sort({matchDate:1});

res.json(matches);

}catch(error){

res.status(500).json({
message:error.message
});

}

});



// Submit prediction
router.post("/predict", async(req,res)=>{

try{

const {
userId,
matchId,
choice
}=req.body;

const match = await FootballMatch.findById(matchId);

if(!match){
return res.status(404).json({
message:"Match not found"
});
}

if(new Date(match.matchDate) <= new Date()){
return res.status(400).json({
message:"Prediction closed"
});
}

const existingPrediction = await Prediction.findOne({
userId,
matchId
});

if(existingPrediction){
return res.status(400).json({
message:"You already predicted this match"
});
}

const prediction = await Prediction.create({
userId,
matchId,
choice,
status:"pending",
week:getCurrentWeek()
});

res.json({
message:"Prediction submitted",
prediction
});

}catch(error){

res.status(400).json({
message:error.message
});

}

});

// My predictions
router.get("/my-predictions/:userId", async(req,res)=>{

try{

const predictions = await Prediction.find({
userId:req.params.userId
})
.populate("matchId")
.sort({createdAt:-1});


res.json(predictions);


}catch(error){

res.status(500).json({
message:error.message
});

}

});


// My rank
router.get("/my-rank/:userId", async(req,res)=>{

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


const index = leaderboard.findIndex(
item=>item._id.toString()===req.params.userId
);


if(index===-1){

return res.json({
rank:null,
points:0,
message:"No predictions yet"
});

}


res.json({

rank:index+1,
points:leaderboard[index].points,
totalPlayers:leaderboard.length

});


}catch(error){

res.status(500).json({
message:error.message
});

}

});


// Weekly leaderboard
router.get("/leaderboard", async(req,res)=>{

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
},

{
$limit:10
},

{
$lookup:{
from:"users",
localField:"_id",
foreignField:"_id",
as:"user"
}
},

{
$unwind:{
path:"$user",
preserveNullAndEmptyArrays:true
}
},

{
$project:{
_id:1,
userName:"$user.name",
points:1
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


module.exports = router;
