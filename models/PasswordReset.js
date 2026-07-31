const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({

email:{
type:String,
required:true,
lowercase:true,
trim:true
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
"PasswordReset",
passwordResetSchema
);
