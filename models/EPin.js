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

status:{
type:String,
enum:[
"pending",
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
