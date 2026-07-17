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
  }


},
{
  timestamps:true
});


module.exports = mongoose.model(
  "SystemSetting",
  systemSettingSchema
);
