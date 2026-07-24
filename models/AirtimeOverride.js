const mongoose = require("mongoose");

const airtimeOverrideSchema = new mongoose.Schema(
{
 network:{
  type:String,
  required:true,
  unique:true
 },

 providerPrice:{
  type:Number,
  default:0
 },

 sellingPrice:{
  type:Number,
  default:100
 },

 profit:{
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
