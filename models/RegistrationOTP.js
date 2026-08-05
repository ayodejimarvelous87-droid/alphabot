const mongoose = require("mongoose");

const registrationOTPSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

phone:{
type:String,
required:true,
index:true
},

email:{
type:String,
required:true
},

password:{
type:String,
required:true
},

referralCode:{
type:String
},

partner:{
type:String
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
"RegistrationOTP",
registrationOTPSchema
);
