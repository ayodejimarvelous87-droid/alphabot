const mongoose = require("mongoose");


const bettingSettingSchema = new mongoose.Schema(
{
service:{
type:String,
required:true,
unique:true
},

fee:{
type:Number,
default:0
},

active:{
type:Boolean,
default:true
}

},
{
timestamps:true
}
);


module.exports = mongoose.model(
"BettingSetting",
bettingSettingSchema
);
