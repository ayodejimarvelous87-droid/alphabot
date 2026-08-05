const AppError = require("../utils/AppError");
const User = require("../models/User");
const Wallet = require("../models/wallet");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const Withdrawal = require("../models/Withdrawal");
const SystemSetting = require("../models/SystemSetting");
const Airtime = require("../models/Airtime");
const AirtimeCash = require("../models/AirtimeCash");
const Data = require("../models/Data");
const Electricity = require("../models/Electricity");
const TVSubscription = require("../models/TVSubscription");
const Betting = require("../models/Betting");
const EPin = require("../models/EPin");
const FundingRequest = require("../models/FundingRequest");
const Beneficiary = require("../models/Beneficiary");
const BankBeneficiary = require("../models/BankBeneficiary");
const DeviceToken = require("../models/DeviceToken");
const AIConversation = require("../models/AIConversation");
const AIUsage = require("../models/AIUsage");
const Recurring = require("../models/Recurring");
const Profit = require("../models/Profit");
const TransactionPin = require("../models/TransactionPin");
const UserState = require("../models/UserState");
const ProfileOTP = require("../models/ProfileOTP");


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


    const result = await Promise.all(

      transactions.map(async(transaction)=>{

        const user = await User.findOne({
          phone: transaction.phone
        });


        return {

          ...transaction.toObject(),

          userName: user ? user.name : "Unknown"

        };

      })

    );


    res.json(result);


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

      throw new AppError(
  "Valid AI limit is required",
  400
);

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
footballFirstPrize,
footballSecondPrize,
footballFirstMinimumPoints,
footballSecondMinimumPoints,
footballMinimumPredictions,
footballMinimumWins
}=req.body;


let setting = await SystemSetting.findOne();


if(!setting){
setting = await SystemSetting.create({});
}


if(footballFirstPrize !== undefined)
setting.footballFirstPrize = Number(footballFirstPrize);


if(footballSecondPrize !== undefined)
setting.footballSecondPrize = Number(footballSecondPrize);


if(footballFirstMinimumPoints !== undefined)
setting.footballFirstMinimumPoints = Number(footballFirstMinimumPoints);


if(footballSecondMinimumPoints !== undefined)
setting.footballSecondMinimumPoints = Number(footballSecondMinimumPoints);


if(footballMinimumPredictions !== undefined)
setting.footballMinimumPredictions = Number(footballMinimumPredictions);


if(footballMinimumWins !== undefined)
setting.footballMinimumWins = Number(footballMinimumWins);


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


const updatePricingSettings = async(req,res)=>{

try{

const pricing=req.body;

let setting=await SystemSetting.findOne();

if(!setting){
setting=await SystemSetting.create({});
}

Object.keys(pricing).forEach(key=>{
if(setting[key]!==undefined){
setting[key]=Number(pricing[key]);
}
});

await setting.save();

res.json({
message:"Pricing settings updated",
setting
});

}catch(error){

res.status(500).json({
message:error.message
});

}

};



const getUserDetails = async(req,res)=>{

try{

const phone = req.params.phone;


const user = await User.findOne({
phone
}).select("-password");


if(!user){

throw new AppError(
  "User not found",
  404
);

}



const wallet = await Wallet.findOne({
phone
});



const transactions = await Transaction.find({
phone
})
.sort({
createdAt:-1
});



const orders = await Order.find({
phone
})
.sort({
createdAt:-1
});



const withdrawals = await Withdrawal.find({
phone
})
.sort({
createdAt:-1
});



res.json({

user,

wallet,

transactions,

orders,

withdrawals

});



}catch(error){

res.status(500).json({
message:error.message
});

}

};


const suspendUser = async(req,res)=>{

try{

const user = await User.findOne({
phone:req.params.phone
});


if(!user){
throw new AppError(
  "User not found",
  404
);
}


user.status="suspended";

await user.save();


res.json({
message:"User suspended",
user
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const activateUser = async(req,res)=>{

try{

const user = await User.findOne({
phone:req.params.phone
});


if(!user){
throw new AppError(
  "User not found",
  404
);
}


user.status="active";

await user.save();


res.json({
message:"User activated",
user
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const deleteUser = async(req,res)=>{

try{

const phone = req.params.phone;

console.log("ADMIN DELETING USER:", phone);


const user = await User.findOne({phone});

if(!user){
  throw new AppError(
    "User not found",
    404
  );
}


await Promise.all([

User.deleteOne({phone}),

Wallet.deleteOne({phone}),

Order.deleteMany({phone}),

Transaction.deleteMany({phone}),

Notification.deleteMany({phone}),

Withdrawal.deleteMany({phone}),

Airtime.deleteMany({phone}),

AirtimeCash.deleteMany({phone}),

Data.deleteMany({phone}),

Electricity.deleteMany({phone}),

TVSubscription.deleteMany({phone}),

Betting.deleteMany({phone}),

EPin.deleteMany({phone}),

FundingRequest.deleteMany({phone}),

Beneficiary.deleteMany({
$or:[
{phone},
{beneficiary_phone:phone}
]
}),

BankBeneficiary.deleteMany({phone}),

DeviceToken.deleteMany({phone}),

AIConversation.deleteMany({phone}),

AIUsage.deleteMany({phone}),

Recurring.deleteMany({phone}),

Profit.deleteMany({phone}),

TransactionPin.deleteMany({phone}),

UserState.deleteMany({phone}),

ProfileOTP.deleteMany({phone})

]);


res.json({
message:"User and all related data deleted"
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};





const upgradeUserToAdmin = async(req,res)=>{

try{

const user = await User.findOne({
phone:req.params.phone
});


if(!user){
throw new AppError(
  "User not found",
  404
);
}


user.role="admin";

await user.save();


res.json({
message:"User upgraded to admin",
user
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


const demoteUserFromAdmin = async(req,res)=>{
  sendBroadcastNotification,
  updateSystemSettings

try{

const user = await User.findOne({
phone:req.params.phone
});


if(!user){
throw new AppError(
  "User not found",
  404
);
}


user.role="user";

await user.save();


res.json({
message:"User removed from admin role",
user
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const sendBroadcastNotification = async(req,res)=>{

try{

const {title,message,type}=req.body;


if(!title || !message){

throw new AppError(
  "Title and message are required",
  400
);

}


const users = await User.find();


const notifications = users.map(user=>({

phone:user.phone,

title,

message,

type:type || "info"

}));


await Notification.insertMany(notifications);


res.json({

message:"Broadcast sent successfully",

sent:notifications.length

});


}catch(error){

res.status(500).json({

message:error.message

});

}

};




const updateSystemSettings = async(req,res)=>{

try{

const {
maintenanceMode,
announcement,
referralPercentage,
airtimeCashMode,
providerMinimumBalance
}=req.body;


let setting = await SystemSetting.findOne();


if(!setting){

setting = await SystemSetting.create({});

}


if(maintenanceMode !== undefined)
setting.maintenanceMode = maintenanceMode;


if(announcement !== undefined)
setting.announcement = announcement;


if(referralPercentage !== undefined)
setting.referralPercentage = Number(referralPercentage);


if(airtimeCashMode !== undefined)
setting.airtimeCashMode = airtimeCashMode;

if(providerMinimumBalance !== undefined)
setting.providerMinimumBalance = Number(providerMinimumBalance);




await setting.save();


res.json({
message:"System settings updated",
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
  updateFootballSettings,
  updatePricingSettings,
  getUserDetails,
  suspendUser,
  activateUser,
  deleteUser,
  upgradeUserToAdmin,
  demoteUserFromAdmin,
  sendBroadcastNotification,
  updateSystemSettings
};


