const mongoose = require("mongoose");


const electricitySettingSchema = new mongoose.Schema(
{
disco:{
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
"ElectricitySetting",
electricitySettingSchema
);
