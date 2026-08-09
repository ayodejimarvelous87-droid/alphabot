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

    providers:{
      vtu:{
        type:mongoose.Schema.Types.Mixed,
        default:null
      },

      blitzpay:{
        type:mongoose.Schema.Types.Mixed,
        default:null
      },

      oplug:{
        type:mongoose.Schema.Types.Mixed,
        default:null
      }
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
