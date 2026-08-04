const mongoose = require("mongoose");

const blogPartnerSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

email:{
type:String,
required:true,
unique:true
},

emailVerified:{
type:Boolean,
default:false
},

emailOtp:{
type:String,
default:null
},

emailOtpExpires:{
type:Date,
default:null
},

password:{
type:String,
required:true
},

code:{
type:String,
required:true,
unique:true
},

bankName:{
type:String,
default:""
},

accountNumber:{
type:String,
default:""
},

accountName:{
type:String,
default:""
},

commissionRate:{
type:Number,
default:30
},

status:{
type:String,
enum:["active","inactive"],
default:"inactive"
},

totalUsers:{
type:Number,
default:0
},

totalEarned:{
type:Number,
default:0
},

lastPayoutDate:{
type:Date,
default:Date.now
},

payoutReminderSent:{
type:Boolean,
default:false
}

},{
timestamps:true
});


module.exports = mongoose.model(
"BlogPartner",
blogPartnerSchema
);
