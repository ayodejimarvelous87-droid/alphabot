const Prediction = require("../models/Prediction");
const FootballReward = require("../models/FootballReward");
const User = require("../models/User");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const getCurrentWeek = require("../utils/getCurrentWeek");
const SystemSetting = require("../models/SystemSetting");


async function createFootballRewards(targetWeek=null){

try{

const week = targetWeek || getCurrentWeek();

let settings = await SystemSetting.findOne();

if(!settings){
settings = await SystemSetting.create({});
}


const leaderboard = await Prediction.aggregate([

{
$match:{
week:week
}
},

{
$group:{
_id:"$userId",
points:{
$sum:"$points"
},
totalPredictions:{
$count:{}
},
wins:{
$sum:{
$cond:[
{$eq:["$status","won"]},
1,
0
]
}
}
}
},

{
$sort:{
points:-1
}
},



]);


const qualifiedPlayers = leaderboard.filter(player=>
player.totalPredictions >= settings.footballMinimumPredictions &&
player.wins >= settings.footballMinimumWins
);

leaderboard.splice(0, leaderboard.length, ...qualifiedPlayers);

leaderboard.splice(2);

const rewards=[

{
position:1,
requiredPoints:settings.footballFirstMinimumPoints,
amount:settings.footballFirstPrize
},

{
position:2,
requiredPoints:settings.footballSecondMinimumPoints,
amount:settings.footballSecondPrize
}

];


for(let i=0;i<leaderboard.length;i++){

const player=leaderboard[i];
const reward=rewards[i];


if(player.points < reward.requiredPoints){

continue;

}


const exists=await FootballReward.findOne({
userId:player._id,
week
});


if(exists){

continue;

}


const user=await User.findById(player._id);

if(!user){

continue;

}


const wallet=await Wallet.findOne({
phone:user.phone
});


if(!wallet){

continue;

}


const balanceBefore=wallet.balance;


wallet.balance += reward.amount;

await wallet.save();


await Transaction.create({

phone:user.phone,

type:"football_reward",

direction:"credit",

amount:reward.amount,

balanceBefore,

balanceAfter:wallet.balance,

description:"Football prediction weekly reward"

});


await FootballReward.create({

userId:player._id,

position:reward.position,

rewardType:"wallet",

amount:reward.amount,

status:"paid",

week

});


}


console.log("Football rewards paid");


}catch(error){

console.log(
"Football reward error:",
error.message
);

}

}


module.exports=createFootballRewards;
