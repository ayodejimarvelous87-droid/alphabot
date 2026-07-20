const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema({

phone:{
type:String,
required:true
},

name:{
type:String,
required:true
},

beneficiary_phone:{
type:String,
required:true
},

service:{
type:String,
required:true
}

},{
timestamps:true
});


module.exports = mongoose.model(
"Beneficiary",
beneficiarySchema
);
