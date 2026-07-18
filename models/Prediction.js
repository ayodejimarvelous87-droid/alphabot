const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({

userId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

userName:{
type:String
},

matchId:{
type:mongoose.Schema.Types.ObjectId,
ref:"FootballMatch",
required:true
},

choice:{
type:String,
enum:["home","draw","away"],
required:true
},

points:{
type:Number,
default:0
},

status:{
type:String,
enum:["pending","locked","won","lost"],
default:"pending"
},

week:{
type:String,
default:()=>{
return new Date().getFullYear()+"-"+Math.ceil(
(
(new Date()-new Date(new Date().getFullYear(),0,1))
/86400000+1
)/7
);
}
},

createdAt:{
type:Date,
default:Date.now
}

});


module.exports = mongoose.model(
"Prediction",
predictionSchema
);
