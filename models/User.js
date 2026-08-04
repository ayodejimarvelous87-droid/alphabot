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


  tokenVersion:{
    type:Number,
    default:0
  },

  failedLoginAttempts:{
    type:Number,
    default:0
  },

  loginBlockedUntil:{
    type:Date,
    default:null
  },

  role:{
    type:String,
    default:"user"
  },

  status:{
    type:String,
    enum:[
      "active",
      "suspended"
    ],
    default:"active"
  },


    emailVerified:{
      type:Boolean,
      default:false
    },


  referralCode:{
    type:String,
    unique:true
  },


  referredBy:{
    type:String,
    default:null
  },

  blogPartner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"BlogPartner",
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
  },

  withdrawBankName:{
    type:String,
    default:null
  },

  withdrawBankCode:{
    type:String,
    default:null
  },

  withdrawAccountNumber:{
    type:String,
    default:null
  },

  withdrawAccountName:{
    type:String,
    default:null
  }

},
{
timestamps:true
});


module.exports = mongoose.model(
"User",
userSchema
);
