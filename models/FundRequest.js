const mongoose = require("mongoose");

const fundRequestSchema = new mongoose.Schema(
{
  phone:{
    type:String,
    required:true
  },

  amount:{
    type:Number,
    required:true
  },

  reference:{
    type:String,
    default:""
  },

  bankName:{
    type:String,
    default:""
  },

  status:{
    type:String,
    enum:["pending","approved","rejected"],
    default:"pending"
  }
},
{
  timestamps:true
});

module.exports = mongoose.model(
  "FundRequest",
  fundRequestSchema
);
