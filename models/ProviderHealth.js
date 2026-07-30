const mongoose = require("mongoose");

const providerHealthSchema = new mongoose.Schema(
{
  provider:{
    type:String,
    required:true
  },

  service:{
    type:String,
    required:true
  },

  status:{
    type:String,
    enum:[
      "online",
      "degraded",
      "offline"
    ],
    default:"online"
  },

  successCount:{
    type:Number,
    default:0
  },

  failureCount:{
    type:Number,
    default:0
  },

  averageResponseTime:{
    type:Number,
    default:0
  },

  lastSuccess:{
    type:Date,
    default:null
  },

  lastFailure:{
    type:Date,
    default:null
  },

  lastError:{
    type:String,
    default:null
  }
},
{
  timestamps:true
});


providerHealthSchema.index({
  provider:1,
  service:1
});


module.exports = mongoose.model(
  "ProviderHealth",
  providerHealthSchema
);
