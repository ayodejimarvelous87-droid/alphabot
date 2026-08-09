const AppError = require("../utils/AppError");
const User = require("../models/User");
const Membership = require("../models/Membership");
const MembershipPaymentRequest =
  require("../models/MembershipPaymentRequest");
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
    // Email failure must not undo a successful membership approval.
    if(user.email){

      const tierName =
        request.tier.charAt(0).toUpperCase() +
        request.tier.slice(1);

      const benefits = request.tier === "gold"
        ? [
            "3x coins on eligible rewards",
            "Weekly member bonuses",
            "Reduced prices during Gold promotions",
            "Access to Gold-only deals"
          ]
        : [
            "2x coins on eligible rewards",
            "Weekly member bonuses",
            "Access to Silver member promotions"
          ];

      const benefitHtml =
        benefits
          .map(item => `<li style="margin-bottom:8px;">${item}</li>`)
          .join("");

      const startsDate =
        startsAt.toLocaleDateString(
          "en-NG",
          {
            day:"numeric",
            month:"long",
            year:"numeric"
          }
        );

      const expiresDate =
        expiresAt.toLocaleDateString(
          "en-NG",
          {
            day:"numeric",
            month:"long",
            year:"numeric"
          }
        );

      const approvalText =
`Hello ${user.name || "there"},

Your AlphaBot ${tierName} membership has been approved successfully.

Membership: ${tierName}
Amount: ₦${Number(request.amount).toLocaleString()}
Activated: ${startsDate}
Expires: ${expiresDate}

Your membership benefits:
${benefits.map(item => `- ${item}`).join("\n")}

Thank you for choosing AlphaBot.`;

      const approvalHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Membership Approved</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:35px 15px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.08);">

<tr>
<td style="background:#111827;padding:28px;text-align:center;">
  <div style="font-size:28px;font-weight:bold;color:#ffffff;">
    AlphaBot
  </div>
  <div style="color:#d1d5db;margin-top:6px;font-size:14px;">
    Membership Confirmation
  </div>
</td>
</tr>

<tr>
<td style="padding:35px 32px;">

<div style="text-align:center;margin-bottom:25px;">
  <div style="font-size:48px;">🎉</div>

  <h1 style="margin:10px 0 8px;color:#111827;font-size:26px;">
    Membership Approved
  </h1>

  <p style="margin:0;color:#6b7280;font-size:15px;">
    Your AlphaBot membership is now active.
  </p>
</div>

<p style="font-size:16px;line-height:1.7;">
  Hello <strong>${user.name || "there"}</strong>,
</p>

<p style="font-size:15px;line-height:1.7;color:#4b5563;">
  Great news! Your payment has been verified and your
  <strong>${tierName} Membership</strong> has been successfully approved.
  Your membership benefits are now active.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0;background:#f9fafb;border-radius:12px;">

<tr>
<td style="padding:14px 18px;color:#6b7280;font-size:14px;">
  Membership
</td>
<td align="right" style="padding:14px 18px;font-weight:bold;font-size:15px;">
  ${tierName}
</td>
</tr>

<tr>
<td style="padding:14px 18px;color:#6b7280;font-size:14px;">
  Amount Paid
</td>
<td align="right" style="padding:14px 18px;font-weight:bold;font-size:15px;">
  ₦${Number(request.amount).toLocaleString()}
</td>
</tr>

<tr>
<td style="padding:14px 18px;color:#6b7280;font-size:14px;">
  Activated
</td>
<td align="right" style="padding:14px 18px;font-size:15px;">
  ${startsDate}
</td>
</tr>

<tr>
<td style="padding:14px 18px;color:#6b7280;font-size:14px;">
  Expires
</td>
<td align="right" style="padding:14px 18px;font-size:15px;">
  ${expiresDate}
</td>
</tr>

</table>

<h2 style="font-size:18px;color:#111827;margin-bottom:12px;">
  Your ${tierName} benefits
</h2>

<ul style="padding-left:22px;color:#4b5563;font-size:14px;line-height:1.6;">
  ${benefitHtml}
</ul>

<div style="margin-top:28px;padding:18px;background:#f3f4f6;border-radius:10px;">
  <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">
    Your membership will remain active until the expiry date shown above.
    Thank you for being part of AlphaBot.
  </p>
</div>

<p style="margin-top:30px;font-size:14px;color:#6b7280;line-height:1.6;">
  If you have any questions about your membership, please contact
  AlphaBot support.
</p>

</td>
</tr>

<tr>
<td style="background:#f9fafb;padding:22px;text-align:center;">
  <div style="font-weight:bold;color:#111827;">
    AlphaBot
  </div>
  <div style="margin-top:6px;font-size:12px;color:#9ca3af;">
    Thank you for choosing AlphaBot.
  </div>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

      try{

        await sendEmail(
          user.email,
          `🎉 Your AlphaBot ${tierName} Membership Has Been Approved`,
          approvalText,
          approvalHtml
        );

      }catch(emailError){

        console.log(
          "Membership approval email failed:",
          emailError.message
        );

      }
    }

    await createNotification(
      user.phone,
      "Membership Activated 🎉",
      `Your ${request.tier.toUpperCase()} membership has been approved and is active until ${expiresAt.toLocaleDateString()}.`,
      "success"
    );

    // Notify the user's registered devices
    const userDevices = await DeviceToken.find({
      phone:user.phone,
      userType:"user"
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
      success:true,
      message:"Membership payment approved",
      membership:{
        tier:user.accountTier,
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
