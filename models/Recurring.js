const mongoose = require("mongoose");

const recurringSchema = new mongoose.Schema(
{
  phone:{
    type:String,
    required:true
  },

  targetPhone:{
    type:String,
    required:true
  },

  service:{
    type:String,
    enum:["data","airtime"],
    required:true
  },

  provider:{
    type:String,
    default:""
  },

  // Data recurring uses the same provider plan identifier
  // used by the normal data purchase flow.
  variationId:{
    type:String,
    default:""
  },

  network:{
    type:String,
    default:""
  },

  planName:{
    type:String,
    default:""
  },

  productId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Product",
    default:null
  },

  amount:{
    type:Number,
    required:true
  },

  frequency:{
    type:String,
    enum:["daily","weekly","monthly"],
    required:true
  },

  status:{
    type:String,
    enum:["active","paused","cancelled"],
    default:"active"
  },

  processing:{
    type:Boolean,
    default:false
  },

  nextRun:{
    type:Date,
    required:true
  }

},
{
  timestamps:true
}
);

module.exports = mongoose.model("Recurring", recurringSchema);
