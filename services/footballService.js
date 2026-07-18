require("dotenv").config();
const axios = require("axios");
const FootballMatch = require("../models/FootballMatch");


const allowedLeagues = [
39,
140,
135,
78,
61,
2,
3,
253
];


async function updateFootballMatches(){

try{

const today = new Date();


const dates = [];

for(let i=0;i<3;i++){
dates.push(
new Date(today.getTime()+86400000*i)
.toISOString()
.split("T")[0]
);
}


let total = 0;


for(const date of dates){


const response = await axios.get(
"https://v3.football.api-sports.io/fixtures",
{
headers:{
"x-apisports-key":process.env.FOOTBALL_API_KEY
},
params:{
date:date
}
}
);



for(const item of response.data.response){


const leagueId = item.league.id;


if(!allowedLeagues.includes(leagueId)){
continue;
}



const fixture = item.fixture;
const teams = item.teams;
const goals = item.goals;



let result = null;


if(goals.home !== null && goals.away !== null){

if(goals.home > goals.away){
result = "home";
}

else if(goals.home < goals.away){
result = "away";
}

else{
result = "draw";
}

}



await FootballMatch.findOneAndUpdate(

{
externalId:String(fixture.id)
},

{

externalId:String(fixture.id),

leagueId:leagueId,

league:item.league.name,

homeTeam:teams.home.name,

awayTeam:teams.away.name,

homeLogo:teams.home.logo,

awayLogo:teams.away.logo,

matchDate:fixture.date,

status:fixture.status.long,

result:result,

homeGoals:goals.home,

awayGoals:goals.away

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
