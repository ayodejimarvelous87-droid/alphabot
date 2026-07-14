const mongoose = require("mongoose");


const withdrawalSchema = new mongoose.Schema(
{

phone:{
type:String,
required:true
},


bankName:{
type:String,
required:true
},


accountNumber:{
type:String,
required:true
},


accountName:{
type:String,
required:true
},


amount:{
type:Number,
required:true
},


fee:{
type:Number,
default:0
},


totalDeducted:{
type:Number,
required:true
},


status:{
type:String,
enum:[
"successful",
"failed"
],
default:"successful"
},


reference:{
type:String,
unique:true
}


},
{
timestamps:true
}
);


module.exports = mongoose.model(
"Withdrawal",
withdrawalSchema
);
