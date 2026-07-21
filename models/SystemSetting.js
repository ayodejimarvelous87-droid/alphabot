const mongoose = require("mongoose");


const systemSettingSchema = new mongoose.Schema({

  airtimeCashRate:{
    type:Number,
    default:180
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

  airtimeProfit:{
    type:Number,
    default:20
  },

  dataProfit:{
    type:Number,
    default:50
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
  }


},
{
  timestamps:true
});


module.exports = mongoose.model(
  "SystemSetting",
  systemSettingSchema
);
