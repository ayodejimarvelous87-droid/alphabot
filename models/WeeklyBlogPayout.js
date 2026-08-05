const mongoose = require("mongoose");

const weeklyBlogPayoutSchema = new mongoose.Schema({

blogPartner:{
type:mongoose.Schema.Types.ObjectId,
ref:"BlogPartner",
required:true
},

weekStart:{
type:Date,
required:true
},

weekEnd:{
type:Date,
required:true
},

totalSales:{
type:Number,
default:0
},

commissionAmount:{
type:Number,
default:0
},

status:{
type:String,
enum:[
"pending_admin_payment",
"paid"
],
default:"pending_admin_payment"
},

paidAt:{
type:Date
},

createdAt:{
type:Date,
default:Date.now
}

});


module.exports = mongoose.model(
"WeeklyBlogPayout",
weeklyBlogPayoutSchema
);
