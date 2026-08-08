const express = require("express");
const router = express.Router();

const SystemSetting = require("../models/SystemSetting");


router.get("/", async(req,res)=>{

try{

const setting =
await SystemSetting.findOne() ||
await SystemSetting.create({});


res.json({
  withdrawalFeeRate: setting.withdrawalFeeRate,
  footballFirstPrize: setting.footballFirstPrize,
  footballSecondPrize: setting.footballSecondPrize,
  footballFirstMinimumPoints: setting.footballFirstMinimumPoints,
  footballSecondMinimumPoints: setting.footballSecondMinimumPoints,
  footballMinimumPredictions: setting.footballMinimumPredictions,
  footballMinimumWins: setting.footballMinimumWins,
  providerMinimumBalance: setting.providerMinimumBalance
});


}catch(error){

res.status(500).json({
message:"Unable to load settings"
});

}

});


module.exports = router;
