require("dotenv").config();
const axios = require("axios");
const FootballMatch = require("../models/FootballMatch");
const Prediction = require("../models/Prediction");


const competitions = [
"PL",
"BL1",
"SA",
"FL1",
"DED",
"PPL",
"PD",
"CL",
"CLI",
"BSA",
"ELC",
"WC"
];


async function updateFootballMatches(){

try{

let total = 0;


for(const competition of competitions){

const response = await axios.get(
`https://api.football-data.org/v4/competitions/${competition}/matches`,
{
headers:{
"X-Auth-Token":process.env.FOOTBALL_API_KEY
}
}
);


const matches = response.data.matches || [];


for(const match of matches){


const score = match.score.fullTime;


let result = null;


if(score.home !== null && score.away !== null){

if(score.home > score.away){
result="home";
}

else if(score.home < score.away){
result="away";
}

else{
result="draw";
}

}


await FootballMatch.findOneAndUpdate(

{
externalId:String(match.id)
},

{

externalId:String(match.id),

leagueId:String(match.competition.code),

league:match.competition.name,

homeTeam:match.homeTeam.name,

awayTeam:match.awayTeam.name,

homeLogo:match.homeTeam.crest,

awayLogo:match.awayTeam.crest,

matchDate:match.utcDate,

status:match.status,

result,

homeGoals:score.home,

awayGoals:score.away

},

{
upsert:true
}

);


total++;

}

}


console.log(
"Football matches updated:",
total
);


}catch(error){

console.log(
"Football update error:",
error.response?.data || error.message
);

}


}


module.exports = updateFootballMatches;
