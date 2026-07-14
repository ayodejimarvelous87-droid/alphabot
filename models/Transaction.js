const mongoose = require("mongoose");


const transactionSchema = new mongoose.Schema(
{

phone:{
type:String,
required:true
},


type:{
type:String,

enum:[
"fund",
"purchase",
"airtime",
"airtime_cash",
"electricity",
"tv",
"betting",
"exam_pin",
"withdrawal",
"recurring",
"refund",
"admin_credit",
"admin_debit",
"referral_reward",
"cashback"
],

required:true
},


direction:{
type:String,

enum:[
"credit",
"debit"
],

default:"debit"
},


amount:{
type:Number,
required:true
},


reference:{
type:String,
default:null
},


service:{
type:String,
default:null
},


originalReference:{
type:String,
default:null
},


reason:{
type:String,
default:null
},


balanceBefore:{
type:Number,
default:0
},


balanceAfter:{
type:Number,
default:0
},


description:{
type:String,
required:true
},


status:{
type:String,
default:"successful"
}


},
{
timestamps:true
}
);


module.exports = mongoose.model(
"Transaction",
transactionSchema
);
