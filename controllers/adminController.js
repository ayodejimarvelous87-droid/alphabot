const User = require("../models/User");
const Wallet = require("../models/wallet");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const SystemSetting = require("../models/SystemSetting");


// Get all users
const getUsers = async (req, res) => {
  try {

    const users = await User.find()
      .select("-password");

    res.json(users);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// Get all wallets
const getWallets = async (req, res) => {
  try {

    const wallets = await Wallet.find();

    res.json(wallets);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// Get all orders
const getOrders = async (req, res) => {
  try {

    const orders = await Order.find()
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// Get all transactions
const getTransactions = async (req, res) => {
  try {

    const transactions = await Transaction.find()
      .sort({ createdAt: -1 });

    res.json(transactions);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// Get all notifications
const getNotifications = async (req, res) => {
  try {

    const notifications = await Notification.find()
      .sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// Update AI daily limit
const updateAILimit = async (req, res) => {

  try {

    const { limit } = req.body;


    if (!limit || Number(limit) < 0) {

      return res.status(400).json({
        message:"Valid AI limit is required"
      });

    }


    let setting = await SystemSetting.findOne();


    if (!setting) {

      setting = await SystemSetting.create({
        aiDailyLimit: Number(limit)
      });

    } else {

      setting.aiDailyLimit = Number(limit);
      await setting.save();

    }


    res.json({
      message:`AI daily limit updated to ${limit}`,
      aiDailyLimit: setting.aiDailyLimit
    });


  } catch(error) {

    res.status(500).json({
      message:error.message
    });

  }

};


const updateFootballSettings = async (req,res)=>{

try{

const{
firstPrize,
secondPrize,
firstMinimumPoints,
secondMinimumPoints
}=req.body;

let setting=await SystemSetting.findOne();

if(!setting){
setting=await SystemSetting.create({});
}

if(firstPrize!==undefined) setting.footballFirstPrize=Number(firstPrize);
if(secondPrize!==undefined) setting.footballSecondPrize=Number(secondPrize);
if(firstMinimumPoints!==undefined) setting.footballFirstMinimumPoints=Number(firstMinimumPoints);
if(secondMinimumPoints!==undefined) setting.footballSecondMinimumPoints=Number(secondMinimumPoints);

await setting.save();

res.json({
message:"Football settings updated",
setting
});

}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports = {
  getUsers,
  getWallets,
  getOrders,
  getTransactions,
  getNotifications,
  updateAILimit,
  updateFootballSettings
};


