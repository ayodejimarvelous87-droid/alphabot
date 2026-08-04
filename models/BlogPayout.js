const mongoose = require("mongoose");

const blogPayoutSchema = new mongoose.Schema({

blogPartner:{
type:mongoose.Schema.Types.ObjectId,
ref:"BlogPartner",
required:true
},

amount:{
type:Number,
required:true
},

periodStart:{
type:Date,
required:true
},

periodEnd:{
type:Date,
default:Date.now
},

reference:{
type:String,
unique:true,
required:true
},

status:{
type:String,
enum:["pending","paid"],
default:"paid"
},

paidAt:{
type:Date,
default:Date.now
}

});


module.exports = mongoose.model(
"BlogPayout",
blogPayoutSchema
);
