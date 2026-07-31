const mongoose = require("mongoose");

const pinOTPSchema = new mongoose.Schema({

phone:{
type:String,
required:true,
index:true
},

otp:{
type:String,
required:true
},

attempts:{
type:Number,
default:0
},

expiresAt:{
type:Date,
required:true,
index:true
}

},{
timestamps:true
});


module.exports = mongoose.model(
"PinOTP",
pinOTPSchema
);
