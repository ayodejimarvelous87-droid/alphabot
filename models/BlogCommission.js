const mongoose = require("mongoose");

const blogCommissionSchema = new mongoose.Schema({

blogPartner:{
type:mongoose.Schema.Types.ObjectId,
ref:"BlogPartner",
required:true
},

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

reference:{
type:String,
unique:true,
required:true
},

amount:{
type:Number,
default:0
},

transactionAmount:{
type:Number,
default:0
},

service:{
type:String,
default:"unknown"
},

transactionReference:{
type:String
},

status:{
type:String,
enum:["pending","available","processed","paid"],
default:"pending"
},

availableAt:{
type:Date,
default:()=>new Date(Date.now()+7*24*60*60*1000)
},

createdAt:{
type:Date,
default:Date.now
}

});


module.exports = mongoose.model(
"BlogCommission",
blogCommissionSchema
);
