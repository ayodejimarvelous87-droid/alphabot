const mongoose = require("mongoose");

const membershipPaymentRequestSchema = new mongoose.Schema(
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

  reference:{
    type:String,
    default:null,
    trim:true
  },

  status:{
    type:String,
    enum:["pending","processing","approved","rejected"],
    default:"pending",
    index:true
  },

  reviewedAt:{
    type:Date,
    default:null
  },

  rejectionReason:{
    type:String,
    default:null
  }
},
{
  timestamps:true
}
);

membershipPaymentRequestSchema.index(
  {
    phone:1,
    status:1
  },
  {
    unique:true,
    partialFilterExpression:{
      status:{
        $in:["pending","processing"]
      }
    }
  }
);

module.exports = mongoose.model(
  "MembershipPaymentRequest",
  membershipPaymentRequestSchema
);
