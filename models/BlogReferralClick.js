const mongoose = require("mongoose");

const blogReferralClickSchema = new mongoose.Schema({
  code:{
    type:String,
    required:true
  },

  blogPartner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"BlogPartner",
    required:true
  },

  ip:{
    type:String
  },

  userAgent:{
    type:String
  },

  converted:{
    type:Boolean,
    default:false
  },

  createdAt:{
    type:Date,
    default:Date.now
  }
});

module.exports = mongoose.model(
  "BlogReferralClick",
  blogReferralClickSchema
);
