const mongoose = require("mongoose");

const profitSchema = new mongoose.Schema({

service:{
 type:String,
 required:true
},

customerAmount:{
 type:Number,
 default:0
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

reference:{
 type:String
},

phone:{
 type:String
}

},{
timestamps:true
});


module.exports = mongoose.model(
"Profit",
profitSchema
);
