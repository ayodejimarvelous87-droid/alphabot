const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({

  title:{
    type:String,
    required:true,
    trim:true
  },

  description:{
    type:String,
    default:""
  },

  icon:{
    type:String,
    default:"🎉"
  },

  type:{
    type:String,
    required:true,
    trim:true
  },

  startsAt:{
    type:Date,
    required:true
  },

  endsAt:{
    type:Date,
    required:true
  },

  status:{
    type:String,
    enum:[
      "draft",
      "scheduled",
      "active",
      "ended",
      "cancelled"
    ],
    default:"draft"
  },

  leaderboardResetAt:{
    type:Date,
    default:null
  }

},{
  timestamps:true
});

module.exports = mongoose.model(
  "Event",
  eventSchema
);
