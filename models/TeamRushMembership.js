const mongoose = require("mongoose");

const teamRushMembershipSchema = new mongoose.Schema({

  event:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Event",
    required:true
  },

  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  team:{
    type:String,
    enum:[
      "alpha",
      "beta"
    ],
    required:true
  },

  joinedAt:{
    type:Date,
    default:Date.now
  }

},{
  timestamps:true
});


/*
 * A user can join a particular Team Rush event
 * only once.
 */
teamRushMembershipSchema.index(
  {
    event:1,
    user:1
  },
  {
    unique:true
  }
);


module.exports = mongoose.model(
  "TeamRushMembership",
  teamRushMembershipSchema
);
