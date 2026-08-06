
const FootballMatch = require("../models/FootballMatch");


async function getFootballContext(){

const matches = await FootballMatch.find({
status:{
$in:[
"Not Started",
"SCHEDULED",
"TIMED"
]
}
})
.sort({
matchDate:1
})
.limit(5);


if(!matches.length){
return "No current match data available.";
}


return matches.map(match=>{

return `
${match.homeTeam} vs ${match.awayTeam}
Status: ${match.status}
Score: ${match.homeGoals || 0}-${match.awayGoals || 0}
`;

}).join("\n");


}


module.exports={
getFootballContext
};
