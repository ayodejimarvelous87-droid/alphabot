const mongoose = require("mongoose");


const tvPlanSchema = new mongoose.Schema(
{
provider:{
type:String,
required:true
},

variation_id:{
type:String,
required:true,
unique:true
},

name:{
type:String,
required:true
},

providerPrice:{
type:Number,
default:0
},

sellingPrice:{
type:Number,
default:0
},

active:{
type:Boolean,
default:true
}

},
{
timestamps:true
}
);


module.exports = mongoose.model(
"TVPlan",
tvPlanSchema
);
