const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
{
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    index:true
  },

  phone:{
    type:String,
    required:true,
    index:true
  },

  tier:{
    type:String,
    enum:["silver","gold"],
    required:true
  },

  amount:{
    type:Number,
    required:true
  },

  durationDays:{
    type:Number,
    default:30
  },

  startsAt:{
    type:Date,
    required:true
  },

  expiresAt:{
    type:Date,
    required:true
  },

  status:{
    type:String,
    enum:["active","expired","cancelled"],
    default:"active"
  },

  source:{
    type:String,
    enum:["admin","wallet","payment"],
    default:"admin"
  }

},
{
  timestamps:true
}
);

membershipSchema.index({
  user:1,
  status:1,
  expiresAt:1
});

module.exports = mongoose.model(
  "Membership",
  membershipSchema
);
