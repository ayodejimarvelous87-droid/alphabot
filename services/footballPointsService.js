const FootballMatch = require("../models/FootballMatch");
const Prediction = require("../models/Prediction");


async function updateFootballPoints(){

try{


const finishedMatches = await FootballMatch.find({
status:"Match Finished",
result:{
$ne:null
}
});



for(const match of finishedMatches){


const predictions = await Prediction.find({
matchId:match._id
});



for(const prediction of predictions){


let points = 0;



if(
prediction.choice === match.result
){

if(match.result === "draw"){

points = 1;

}else{

points = 3;

}

}



await Prediction.findByIdAndUpdate(

prediction._id,

{
points:points,
status: points > 0 ? "won" : "lost"
}

);


}


}



console.log(
"Football points updated"
);



}catch(error){

console.log(
"Football points error:",
error.message
);

}


}



module.exports = updateFootballPoints;
