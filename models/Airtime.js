const mongoose = require("mongoose");


const airtimeSchema = new mongoose.Schema({

phone:{
 type:String,
 required:true
},


network:{
 type:String,
 required:true
},


amount:{
 type:Number,
 required:true
},


providerCost:{
 type:Number,
 default:0
},


profit:{
 type:Number,
 default:0
},


source:{
 type:String,
 enum:[
  "provider",
  "inventory"
 ],
 default:"provider"
},


status:{
 type:String,
 enum:[
  "pending",
  "successful",
  "failed"
 ],
 default:"pending"
},


reference:{
 type:String,
 unique:true
}


},{
timestamps:true
});


module.exports = mongoose.model(
"Airtime",
airtimeSchema
);
