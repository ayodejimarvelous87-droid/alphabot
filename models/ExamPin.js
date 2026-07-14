const mongoose = require("mongoose");


const examPinSchema = new mongoose.Schema(
{

exam:{
type:String,
enum:["WAEC","JAMB","NECO","NABTEB"],
required:true
},


pin:{
type:String,
required:true,
unique:true
},


price:{
type:Number,
required:true
},


status:{
type:String,
enum:["available","used"],
default:"available"
},


usedBy:{
type:String,
default:""
},


usedAt:{
type:Date,
default:null
}


},
{
timestamps:true
}
);


module.exports = mongoose.model("ExamPin", examPinSchema);
