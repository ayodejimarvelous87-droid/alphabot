const mongoose = require("mongoose");

const adminOTPSchema = new mongoose.Schema({

username:{
type:String,
required:true
},

accountType:{
type:String,
enum:["admin","user"],
default:"admin"
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
required:true
}

},{
timestamps:true
});


module.exports = mongoose.model(
"AdminOTP",
adminOTPSchema
);
