const mongoose = require("mongoose");

const profileOTPSchema = new mongoose.Schema({

phone:{
type:String,
required:true
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
"ProfileOTP",
profileOTPSchema
);
