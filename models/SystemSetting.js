const mongoose = require("mongoose");


const systemSettingSchema = new mongoose.Schema({

  airtimeCashProfit:{
    type:Number,
    default:15
  },

  airtimeCashRate:{
    type:Number,
    default:80
  },


  withdrawalFeeRate:{
    type:Number,
    default:1
  },


  aiDailyLimit:{
    type:Number,
    default:20
  },

  footballFirstPrize:{
    type:Number,
    default:1500
  },

  footballSecondPrize:{
    type:Number,
    default:1000
  },

  footballFirstMinimumPoints:{
    type:Number,
    default:200
  },

  footballSecondMinimumPoints:{
    type:Number,
    default:180
  },

  footballMinimumPredictions:{
    type:Number,
    default:20
  },

  footballMinimumWins:{
    type:Number,
    default:10
  },

  footballAIEnabled:{
    type:Boolean,
    default:true
  },

  footballIdleChatEnabled:{
    type:Boolean,
    default:true
  },

  footballIdleChatInterval:{
    type:Number,
    default:30
  },

  footballAnalystStyle:{
    type:String,
    default:"balanced"
  },

  goalMasterStyle:{
    type:String,
    default:"hype"
  },

  footballGoalMasterStyle:{
    type:String,
    default:"hype"
  },

  airtimeProfit:{
    type:Number,
    default:20
  },

  dataProfit:{
    type:Number,
    default:50
  },


  // AB Coins
  abCoinsPer100Naira:{
    type:Number,
    default:0.2
  },

  abCoinsRedemptionTarget:{
    type:Number,
    default:1000
  },

  abCoinsRedemptionReward:{
    type:Number,
    default:200
  },


    providerMinimumBalance:{
      type:Number,
      default:500
    },

  electricityProfit:{
    type:Number,
    default:50
  },

  tvProfit:{
    type:Number,
    default:50
  },

  examPinProfit:{
    type:Number,
    default:50
  },

  bettingProfit:{
    type:Number,
    default:20
  },

  airtimeCashMode:{
    type:String,
    enum:["manual","automatic"],
    default:"manual"
  },


  maintenanceMode:{
    type:Boolean,
    default:false
  },

  announcement:{
    type:String,
    default:""
  },

  
  // Fraud and transaction limits

  dailyTransactionLimit:{
    type:Number,
    default:100000
  },

  dailyWithdrawalLimit:{
    type:Number,
    default:200000
  },

  dailyTransferLimit:{
    type:Number,
    default:500000
  },

  maxTransactionsPerDay:{
    type:Number,
    default:50
  },

  fraudVelocityWindow:{
    type:Number,
    default:5
  },

  maxTransactionsPerWindow:{
    type:Number,
    default:10
  },


  referralPercentage:{
    type:Number,
    default:1
  },

  membershipSilverPrice:{
    type:Number,
    default:1000
  },

  membershipGoldPrice:{
    type:Number,
    default:2000
  },

  membershipDurationDays:{
    type:Number,
    default:30
  },

  // Membership pricing
  silverMembershipPrice:{
    type:Number,
    default:1000
  },

  goldMembershipPrice:{
    type:Number,
    default:2000
  }


},
{
  timestamps:true
});


module.exports = mongoose.model(
  "SystemSetting",
  systemSettingSchema
);
