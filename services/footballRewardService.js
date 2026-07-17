const Prediction = require("../models/Prediction");
const FootballReward = require("../models/FootballReward");
const getCurrentWeek = require("../utils/getCurrentWeek");


async function createFootballRewards(){

try{

const week = getCurrentWeek();



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
}
}
},

{
$sort:{
points:-1
}
},

{
$limit:2
}

]);



const rewards=[
"1GB",
"500MB"
];



for(let i=0;i<leaderboard.length;i++){


const existingReward = await FootballReward.findOne({

userId:leaderboard[i]._id,

week

});


if(existingReward){

continue;

}



await FootballReward.create({

userId:leaderboard[i]._id,

position:i+1,

reward:rewards[i],

week

});


}



console.log("Football rewards created");


}catch(error){

console.log(
"Football reward error:",
error.message
);

}

}


module.exports=createFootballRewards;
