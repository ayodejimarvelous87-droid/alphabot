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

reward:{
type:String,
required:true
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
