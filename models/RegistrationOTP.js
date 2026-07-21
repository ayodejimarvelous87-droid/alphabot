const mongoose = require("mongoose");

const registrationOTPSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

phone:{
type:String,
required:true
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

otp:{
type:String,
required:true
},

expiresAt:{
type:Date,
required:true
}

},{
timestamps:true
});


module.exports = mongoose.model(
"RegistrationOTP",
registrationOTPSchema
);
