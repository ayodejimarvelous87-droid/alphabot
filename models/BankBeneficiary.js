const mongoose = require("mongoose");

const bankBeneficiarySchema = new mongoose.Schema({

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
}

},{
timestamps:true
});

module.exports = mongoose.model(
"BankBeneficiary",
bankBeneficiarySchema
);
