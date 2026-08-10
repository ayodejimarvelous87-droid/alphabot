const mongoose = require("mongoose");

const dataPlanCacheSchema = new mongoose.Schema(
  {
    key:{
      type:String,
      unique:true,
      required:true
    },

    data:{
      type:mongoose.Schema.Types.Mixed,
      required:true
    },

    // Provider-specific raw/normalized plans.
    // Keys are provider names, so new providers can be
    // added without changing this schema.
    providers:{
      type:mongoose.Schema.Types.Mixed,
      default:{}
    },

    updatedAt:{
      type:Date,
      default:Date.now
    }
  },
  {
    timestamps:true
  }
);

module.exports = mongoose.model(
  "DataPlanCache",
  dataPlanCacheSchema
);
