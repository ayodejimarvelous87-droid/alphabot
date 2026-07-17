const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
{
  name:{
    type:String,
    required:true
  },


  phone:{
    type:String,
    required:true,
    unique:true
  },


  network:{
    type:String,
    default:"MTN"
  },


  email:{
    type:String,
    unique:true,
    sparse:true
  },


  password:{
    type:String,
    default:null
  },


  wallet:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Wallet"
  },


  role:{
    type:String,
    default:"user"
  },


  referralCode:{
    type:String,
    unique:true
  },


  referredBy:{
    type:String,
    default:null
  },


  referralEarnings:{
    type:Number,
    default:0
  },


  firstPurchaseCompleted:{
    type:Boolean,
    default:false
  },


  referralRewardGiven:{
    type:Boolean,
    default:false
  }

},
{
timestamps:true
});


module.exports = mongoose.model(
"User",
userSchema
);
