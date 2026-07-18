const mongoose = require("mongoose");

const footballRewardSchema = new mongoose.Schema({

userId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

position:{
type:Number,
required:true
},

rewardType:{
type:String,
enum:["wallet","data"],
required:true
},

amount:{
type:Number,
default:0
},

dataAmount:{
type:String,
default:null
},

status:{
type:String,
default:"pending"
},

week:{
type:String,
required:true
},

createdAt:{
type:Date,
default:Date.now
}

});


module.exports = mongoose.model(
"FootballReward",
footballRewardSchema
);
