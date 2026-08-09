const AppError = require("../utils/AppError");
const User = require("../models/User");
const Membership = require("../models/Membership");
const MembershipPaymentRequest =
  require("../models/MembershipPaymentRequest");

const {
  sendMembershipApprovalEmail
} = require("../services/membershipEmailService");
const SystemSetting = require("../models/SystemSetting");
const {createNotification} =
  require("../services/notificationService");
const normalizePhone =
  require("../utils/phone");
const DeviceToken = require("../models/DeviceToken");
const { sendPushNotification } =
  require("../services/firebaseService");


// Get pending membership payments
const getMembershipPaymentRequests = async(req,res)=>{
  try{

    const requests =
      await MembershipPaymentRequest.find({
        status:"pending"
      })
      .sort({createdAt:-1})
      .populate(
        "user",
        "name phone accountTier accountTierExpiresAt"
      )
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


// Approve membership payment
const approveMembershipPayment = async(req,res)=>{
  try{

    const request =
      await MembershipPaymentRequest.findOneAndUpdate(
        {
          _id:req.params.id,
          status:"pending"
        },
        {
          status:"processing"
        },
        {
          new:true
        }
      );

    if(!request){
      throw new AppError(
        "Request already processed or not found",
        400
      );
    }

    const user =
      await User.findById(request.user);

    if(!user){
      request.status = "rejected";
      request.rejectionReason = "User not found";
      request.reviewedAt = new Date();
      await request.save();

      throw new AppError(
        "User not found",
        404
      );
    }

    const setting =
      await SystemSetting.findOne() ||
      await SystemSetting.create({});

    const durationDays =
      Number(setting.membershipDurationDays || 30);

    const now = new Date();

    let startsAt = now;

    // If the user's existing membership is still active,
    // extend from its current expiry instead of shortening it.
    if(
      user.accountTier !== "normal" &&
      user.accountTierExpiresAt &&
      new Date(user.accountTierExpiresAt) > now
    ){
      startsAt =
        new Date(user.accountTierExpiresAt);
    }

    const expiresAt =
      new Date(startsAt);

    expiresAt.setDate(
      expiresAt.getDate() + durationDays
    );

    user.accountTier = request.tier;
    user.accountTierExpiresAt = expiresAt;

    user.membershipExpiryReminderSentAt = null;
    user.membershipExpiredNotificationSentAt = null;

    await user.save();

    await Membership.create({
      user:user._id,
      phone:user.phone,
      tier:request.tier,
      amount:request.amount,
      durationDays,
      startsAt,
      expiresAt,
      source:"payment",
      status:"active"
    });

    request.status = "approved";
    request.reviewedAt = now;

    await request.save();

    // Send membership approval email.
    // Email failure must never undo a successful membership approval.
    try {

      await sendMembershipApprovalEmail(
        user,
        request,
        startsAt,
        expiresAt
      );

    } catch (emailError) {

      console.error(
        "Membership approval email failed:",
        emailError.response?.data || emailError.message
      );

    }



    await createNotification(
      user.phone,
      "Membership Activated 🎉",
      `Your ${request.tier.toUpperCase()} membership has been approved and is active until ${expiresAt.toLocaleDateString()}.`,
      "success"
    );

    // Notify the user's registered devices
    const userDevices = await DeviceToken.find({
      phone: user.phone,
      userType: "user"
    }).lean();

    await Promise.all(
      userDevices.map(device =>
        sendPushNotification(
          device.token,
          "Membership Activated 🎉",
          `Your ${request.tier.toUpperCase()} membership has been approved and is active until ${expiresAt.toLocaleDateString()}.`
        )
      )
    );

    res.json({
      success: true,
      message: "Membership payment approved",
      membership: {
        tier: user.accountTier,
        startsAt,
        expiresAt
      }
    });

  }catch(error){

    res.status(error.statusCode || 500).json({
      success:false,
      message:error.message
    });

  }
};


// Reject membership payment
const rejectMembershipPayment = async(req,res)=>{
  try{

    const {reason} = req.body;

    const request =
      await MembershipPaymentRequest.findOneAndUpdate(
        {
          _id:req.params.id,
          status:"pending"
        },
        {
          status:"rejected",
          rejectionReason:
            reason ?
            String(reason).trim() :
            "Payment could not be verified",
          reviewedAt:new Date()
        },
        {
          new:true
        }
      );

    if(!request){
      throw new AppError(
        "Request already processed or not found",
        400
      );
    }

    await createNotification(
      request.phone,
      "Membership Payment Rejected",
      `Your ${request.tier.toUpperCase()} membership payment request was rejected.${reason ? ` Reason: ${reason}` : ""}`,
      "warning"
    );

    const userDevices = await DeviceToken.find({
      phone:request.phone,
      userType:"user"
    }).lean();

    await Promise.all(
      userDevices.map(device =>
        sendPushNotification(
          device.token,
          "Membership Payment Rejected",
          `Your ${request.tier.toUpperCase()} membership payment request was rejected.${reason ? ` Reason: ${reason}` : ""}`
        )
      )
    );

    res.json({
      success:true,
      message:"Membership payment rejected"
    });

  }catch(error){

    res.status(error.statusCode || 500).json({
      success:false,
      message:error.message
    });

  }
};


// Get membership pricing
const getMembershipPricing = async(req,res)=>{
  try{

    const setting =
      await SystemSetting.findOne() ||
      await SystemSetting.create({});

    res.json({
      success:true,
      silver:{
        price:Number(
          setting.membershipSilverPrice || 1000
        ),
        durationDays:Number(
          setting.membershipDurationDays || 30
        )
      },
      gold:{
        price:Number(
          setting.membershipGoldPrice || 2000
        ),
        durationDays:Number(
          setting.membershipDurationDays || 30
        )
      }
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};


// Admin changes membership pricing
const updateMembershipPricing = async(req,res)=>{
  try{

    const {
      silverPrice,
      goldPrice,
      durationDays
    } = req.body;

    let setting =
      await SystemSetting.findOne();

    if(!setting){
      setting =
        await SystemSetting.create({});
    }

    if(silverPrice !== undefined){

      const value = Number(silverPrice);

      if(!Number.isFinite(value) || value <= 0){
        throw new AppError(
          "Invalid silver membership price",
          400
        );
      }

      setting.membershipSilverPrice = value;
    }

    if(goldPrice !== undefined){

      const value = Number(goldPrice);

      if(!Number.isFinite(value) || value <= 0){
        throw new AppError(
          "Invalid gold membership price",
          400
        );
      }

      setting.membershipGoldPrice = value;
    }

    if(durationDays !== undefined){

      const value = Number(durationDays);

      if(
        !Number.isInteger(value) ||
        value <= 0 ||
        value > 3650
      ){
        throw new AppError(
          "Invalid membership duration",
          400
        );
      }

      setting.membershipDurationDays = value;
    }

    await setting.save();

    res.json({
      success:true,
      message:"Membership pricing updated",
      pricing:{
        silverPrice:setting.membershipSilverPrice,
        goldPrice:setting.membershipGoldPrice,
        durationDays:setting.membershipDurationDays
      }
    });

  }catch(error){

    res.status(error.statusCode || 500).json({
      success:false,
      message:error.message
    });

  }
};


module.exports = {
  getMembershipPaymentRequests,
  approveMembershipPayment,
  rejectMembershipPayment,
  getMembershipPricing,
  updateMembershipPricing
};
