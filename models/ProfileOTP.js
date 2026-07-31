const mongoose = require("mongoose");

const profileOTPSchema = new mongoose.Schema({

phone:{
type:String,
required:true,
index:true
},

email:{
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
"ProfileOTP",
profileOTPSchema
);
