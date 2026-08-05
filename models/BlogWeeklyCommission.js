const mongoose = require("mongoose");

const schema = new mongoose.Schema({

  blogPartner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"BlogPartner",
    required:true
  },

  week:{
    type:String,
    required:true
  },

  totalSales:{
    type:Number,
    default:0
  },

  commission:{
    type:Number,
    default:0
  },

  status:{
    type:String,
    default:"pending"
  },

  createdAt:{
    type:Date,
    default:Date.now
  }

});

schema.index({blogPartner:1,week:1},{unique:true});

module.exports = mongoose.model(
"BlogWeeklyCommission",
schema
);
