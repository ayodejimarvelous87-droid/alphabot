const mongoose = require("mongoose");

const ePinSchema = new mongoose.Schema({

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

quantity:{
type:Number,
required:true
},

pins:[String],

reference:{
type:String,
unique:true
},

order_id:{
type:String,
default:null
},

status:{
type:String,
enum:[
"pending",
"processing",
"successful",
"failed"
],
default:"pending"
}

},{
timestamps:true
});


module.exports = mongoose.model(
"EPin",
ePinSchema
);
