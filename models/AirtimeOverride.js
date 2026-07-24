const mongoose = require("mongoose");

const airtimeOverrideSchema = new mongoose.Schema(
{
 network:{
  type:String,
  required:true,
  unique:true
 },

 discount:{
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
"AirtimeOverride",
airtimeOverrideSchema
);
