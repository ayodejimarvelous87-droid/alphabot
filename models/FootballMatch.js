const mongoose = require("mongoose");


const footballMatchSchema = new mongoose.Schema({


externalId:{
type:String,
unique:true,
required:true
},


leagueId:{
type:String
},


league:{
type:String
},


homeTeam:{
type:String,
required:true
},


awayTeam:{
type:String,
required:true
},


homeLogo:{
type:String
},


awayLogo:{
type:String
},


matchDate:{
type:Date,
required:true
},


status:{
type:String,
default:"upcoming"
},


result:{
type:String,
default:null
},


homeGoals:{
type:String,
default:null
},


awayGoals:{
type:String,
default:null
}


});


module.exports = mongoose.model(
"FootballMatch",
footballMatchSchema
);
