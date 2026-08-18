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
const ABCoinTransaction = require("../models/ABCoinTransaction");
const mongoose = require("mongoose");



// Adjust a user's AB Coins
const adjustUserCoins = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    const phone = req.params.phone;

    const {
      action,
      amount,
      reason
    } = req.body;

    const numericAmount = Number(amount);

    if (!["increase", "deduct"].includes(action)) {
      return res.status(400).json({
        message: "Action must be increase or deduct"
      });
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid coin amount"
      });
    }

    if (numericAmount > 1000000) {
      return res.status(400).json({
        message: "Coin adjustment limit exceeded"
      });
    }

    if (
      reason !== undefined &&
      reason !== null &&
      String(reason).trim().length > 500
    ) {
      return res.status(400).json({
        message: "Reason is too long"
      });
    }

    let result;

    await session.withTransaction(async () => {

      const user = await User.findOne({
        phone
      }).session(session);

      if (!user) {
        throw new AppError(
          "User not found",
          404
        );
      }

      const balanceBefore =
        Number(user.abCoins || 0);

      const signedAmount =
        action === "increase"
          ? numericAmount
          : -numericAmount;

      const balanceAfter =
        Math.round(
          (balanceBefore + signedAmount) * 100
        ) / 100;

      if (balanceAfter < 0) {
        throw new AppError(
          "Insufficient AB Coins",
          400
        );
      }

      user.abCoins = balanceAfter;

      await user.save({
        session
      });

      const adjustmentReason =
        String(reason || "").trim() ||
        (
          action === "increase"
            ? "Admin increased AB Coins"
            : "Admin deducted AB Coins"
        );

      await ABCoinTransaction.create(
        [{
          phone,

          type: "admin_adjustment",

          coins: signedAmount,

          balanceBefore,

          balanceAfter,

          description:
            adjustmentReason,

          reference:
            `ABADMIN-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 10)}`
        }],
        {
          session
        }
      );

      result = {
        phone,
        action,
        coinsAdjusted: signedAmount,
        balanceBefore,
        balanceAfter
      };

    });

    return res.json({
      message:
        action === "increase"
          ? "AB Coins increased successfully"
          : "AB Coins deducted successfully",

      result
    });

  } catch (error) {

    return res.status(
      error.statusCode || 500
    ).json({
      message: error.message
    });

  } finally {

    await session.endSession();

  }
};


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


if(req.body.footballAIEnabled !== undefined)
setting.footballAIEnabled = Boolean(req.body.footballAIEnabled);


if(req.body.footballIdleChatEnabled !== undefined)
setting.footballIdleChatEnabled = Boolean(req.body.footballIdleChatEnabled);


if(req.body.footballIdleChatInterval !== undefined)
setting.footballIdleChatInterval = Number(req.body.footballIdleChatInterval);


if(req.body.footballAnalystStyle !== undefined)
setting.footballAnalystStyle = req.body.footballAnalystStyle;


if(req.body.goalMasterStyle !== undefined)
setting.goalMasterStyle = req.body.goalMasterStyle;


if(req.body.footballGoalMasterStyle !== undefined)
setting.footballGoalMasterStyle = req.body.footballGoalMasterStyle;


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


const abCoinTransactions = await ABCoinTransaction.find({
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

withdrawals,

abCoinTransactions

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
user.tokenVersion = (user.tokenVersion || 0) + 1;

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





const updateUserAccountTier = async(req,res)=>{
  try{

    const {tier, durationDays} = req.body;

    const allowedTiers = [
      "normal",
      "silver",
      "gold"
    ];

    if(!allowedTiers.includes(tier)){
      return res.status(400).json({
        success:false,
        message:"Invalid account tier"
      });
    }

    const user = await User.findOne({
      phone:req.params.phone
    });

    if(!user){
      throw new AppError(
        "User not found",
        404
      );
    }

    // NORMAL = remove membership
    if(tier === "normal"){

      const previousTier = user.accountTier;

      user.accountTier = "normal";
      user.accountTierExpiresAt = null;

      user.membershipExpiryReminderSentAt = null;
      user.membershipExpiredNotificationSentAt = null;

      await user.save();

      // Send demotion email without allowing email failure
      // to undo the successful demotion.
      if(
        previousTier !== "normal" &&
        user.email
      ){

        try{

          const {
            sendMembershipDemotionEmail
          } = require("../services/membershipEmailService");

          await sendMembershipDemotionEmail(user);

        }catch(emailError){

          console.log(
            "Membership demotion email error:",
            emailError.message
          );

        }

      }

      return res.json({
        success:true,
        message:"User returned to normal tier",
        accountTier:"normal",
        accountTierExpiresAt:null
      });
    }

    const days = Number(durationDays || 30);

    if(!Number.isInteger(days) || days <= 0 || days > 3650){
      return res.status(400).json({
        success:false,
        message:"Invalid membership duration"
      });
    }

    const now = new Date();

    // If current membership is still active,
    // extend from its current expiry.
    const currentExpiry =
      user.accountTierExpiresAt &&
      new Date(user.accountTierExpiresAt) > now
        ? new Date(user.accountTierExpiresAt)
        : now;

    const expiresAt = new Date(currentExpiry);

    expiresAt.setDate(
      expiresAt.getDate() + days
    );

    user.accountTier = tier;
    user.accountTierExpiresAt = expiresAt;

    user.membershipExpiryReminderSentAt = null;
    user.membershipExpiredNotificationSentAt = null;

    await user.save();

    const Membership =
      require("../models/Membership");

    const setting = await SystemSetting.findOne();

    const prices = {
      silver: Number(setting?.membershipSilverPrice ?? 1000),
      gold: Number(setting?.membershipGoldPrice ?? 2000)
    };

    await Membership.create({
      user:user._id,
      phone:user.phone,
      tier,
      amount:prices[tier],
      durationDays:days,
      startsAt:now,
      expiresAt,
      source:"admin",
      status:"active"
    });

    // Send admin upgrade email without allowing
    // email failure to undo the successful upgrade.
    if(user.email){

      try{

        const {
          sendMembershipAdminUpgradeEmail
        } = require("../services/membershipEmailService");

        await sendMembershipAdminUpgradeEmail(
          user,
          tier,
          now,
          expiresAt
        );

      }catch(emailError){

        console.log(
          "Admin membership upgrade email error:",
          emailError.message
        );

      }

    }

    res.json({
      success:true,
      message:`User upgraded to ${tier}`,
      accountTier:user.accountTier,
      accountTierExpiresAt:user.accountTierExpiresAt
    });

  }catch(error){

    res.status(error.statusCode || 500).json({
      success:false,
      message:error.message
    });

  }
};

const getUserMembership = async(req,res)=>{
  try{

    const user = await User.findOne({
      phone:req.params.phone
    }).select(
      "name phone accountTier accountTierExpiresAt"
    );

    if(!user){
      throw new AppError(
        "User not found",
        404
      );
    }

    const now = new Date();

    let tier = user.accountTier || "normal";
    let expiresAt = user.accountTierExpiresAt;

    if(
      tier !== "normal" &&
      expiresAt &&
      new Date(expiresAt) <= now
    ){

      tier = "normal";
      expiresAt = null;

      user.accountTier = "normal";
      user.accountTierExpiresAt = null;

      await user.save();
    }

    const Membership =
      require("../models/Membership");

    const history = await Membership.find({
      phone:user.phone
    })
    .sort({createdAt:-1})
    .limit(20)
    .lean();

    res.json({
      success:true,

      user:{
        name:user.name,
        phone:user.phone,
        accountTier:tier,
        accountTierExpiresAt:expiresAt
      },

      history
    });

  }catch(error){

    res.status(error.statusCode || 500).json({
      success:false,
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

user.tokenVersion = (user.tokenVersion || 0) + 1;

await user.save();


res.json({
message:"User upgraded to admin",
user:{
  name:user.name,
  phone:user.phone,
  email:user.email,
  role:user.role
}
});


}catch(error){

res.status(error.statusCode || 500).json({
success:false,
message:error.message
});

}

};


const demoteUserFromAdmin = async(req,res)=>{

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

user.tokenVersion = (user.tokenVersion || 0) + 1;

await user.save();


res.json({
message:"User removed from admin role",
user:{
  name:user.name,
  phone:user.phone,
  email:user.email,
  role:user.role
}
});


}catch(error){

res.status(error.statusCode || 500).json({
success:false,
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

console.log("SYSTEM SETTINGS UPDATE BODY:", req.body);

try{

const {
maintenanceMode,
announcement,
referralPercentage,
airtimeCashMode,
providerMinimumBalance,
abCoinsPer100Naira,
abCoinsRedemptionTarget,
abCoinsRedemptionReward
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

if(abCoinsPer100Naira !== undefined){

const value = Number(abCoinsPer100Naira);

if(!Number.isFinite(value) || value <= 0)
return res.status(400).json({
message:"AB Coins per ₦100 must be greater than 0"
});

setting.abCoinsPer100Naira = value;

}

if(abCoinsRedemptionTarget !== undefined){

const value = Number(abCoinsRedemptionTarget);

if(!Number.isInteger(value) || value <= 0)
return res.status(400).json({
message:"AB Coins redemption target must be a positive whole number"
});

setting.abCoinsRedemptionTarget = value;

}

if(abCoinsRedemptionReward !== undefined){

const value = Number(abCoinsRedemptionReward);

if(!Number.isFinite(value) || value <= 0)
return res.status(400).json({
message:"AB Coins redemption reward must be greater than 0"
});

setting.abCoinsRedemptionReward = value;

}




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
  adjustUserCoins,
  suspendUser,
  activateUser,
  deleteUser,
  upgradeUserToAdmin,
  updateUserAccountTier,
  getUserMembership,
  demoteUserFromAdmin,
  sendBroadcastNotification,
  updateSystemSettings
};


