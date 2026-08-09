const mongoose = require("mongoose");

const dataPriceSchema = new mongoose.Schema({
  variation_id:{
    type:String,
    required:true,
    unique:true
  },

  provider:{
    type:String,
    required:true
  },

  providerPlanId:{
    type:String,
    default:""
  },

  network:{
    type:String
  },

  name:{
    type:String
  },

  providerPrice:{
    type:Number,
    default:0
  },

  sellingPrice:{
    type:Number,
    default:0
  }

},{
  timestamps:true
});

module.exports = mongoose.model("DataPrice", dataPriceSchema);
