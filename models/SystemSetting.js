const mongoose = require("mongoose");


const systemSettingSchema = new mongoose.Schema({

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
    default:100
  },

  footballSecondMinimumPoints:{
    type:Number,
    default:80
  }


},
{
  timestamps:true
});


module.exports = mongoose.model(
  "SystemSetting",
  systemSettingSchema
);
