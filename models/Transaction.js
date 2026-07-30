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
    "data",
"airtime_cash",
"electricity",
"tv",
"betting",
"exam_pin",
"recharge_pin",
"withdrawal",
"recurring",
"refund",
"admin_credit",
"admin_debit",
"referral_reward",
"cashback",
"football_reward",
"bank_transfer"
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
unique:true,
sparse:true,
default:null
},

flutterwaveId:{
type:String,
unique:true,
sparse:true,
default:null
},

flutterwaveReference:{
type:String,
default:null
},

vtuOrderId:{
type:String,
unique:true,
sparse:true,
default:null
},

vtuRequestId:{
type:String,
unique:true,
sparse:true,
default:null
},

vtuStatus:{
type:String,
default:null
},


providerResponse:{
type:Object,
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

idempotencyKey:{
type:String,
unique:true,
sparse:true
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
enum:[
"pending",
"successful",
"failed",
"cancelled",
"refunded"
],
default:"successful"
}


},
{
timestamps:true
}
);


transactionSchema.index({
phone:1,
createdAt:-1
});



module.exports = mongoose.model(
"Transaction",
transactionSchema
);
