const AppError = require("../utils/AppError");
const BankSettings = require("../models/BankSettings");
const SystemSetting = require("../models/SystemSetting");
const MembershipPaymentRequest =
  require("../models/MembershipPaymentRequest");
const normalizePhone =
  require("../utils/phone");


// Get membership payment information
const getMembershipPaymentInfo = async(req,res)=>{
  try{

    const setting =
      await SystemSetting.findOne() ||
      await SystemSetting.create({});

    const bank =
      await BankSettings.findOne()
      .sort({createdAt:-1})
      .lean();

    if(!bank){
      throw new AppError(
        "Membership payment account has not been configured",
        503
      );
    }

    res.json({
      success:true,

      silver:{
        price:Number(
          setting.membershipSilverPrice || 1000
        ),
        durationDays:Number(
          setting.membershipDurationDays || 30
        ),
        benefits:[
          "2x coins on eligible rewards",
          "Weekly member bonuses",
          "Access to Silver member promotions"
        ]
      },

      gold:{
        price:Number(
          setting.membershipGoldPrice || 2000
        ),
        durationDays:Number(
          setting.membershipDurationDays || 30
        ),
        benefits:[
          "3x coins on eligible rewards",
          "Weekly member bonuses",
          "Reduced prices during Gold promotions",
          "Access to Gold-only deals"
        ]
      },

      paymentAccount:{
        bankName:bank.bankName,
        accountNumber:bank.accountNumber,
        accountName:bank.accountName,
        instructions:bank.instructions
      }

    });

  }catch(error){

    res.status(error.statusCode || 500).json({
      success:false,
      message:error.message
    });

  }
};


// Get user's membership payment requests
const getMyMembershipPayments = async(req,res)=>{
  try{

    const phone =
      normalizePhone(req.user.phone);

    const requests =
      await MembershipPaymentRequest.find({
        phone
      })
      .sort({createdAt:-1})
      .limit(20)
      .lean();

    res.json({
      success:true,
      requests
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};


module.exports = {
  getMembershipPaymentInfo,
  getMyMembershipPayments
};
