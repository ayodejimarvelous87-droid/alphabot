const crypto = require("crypto");
const hashResetOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const auditLogger = require("../services/auditLogger");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const BlogPartner = require("../models/BlogPartner");
const BlogReferralClick = require("../models/BlogReferralClick");
const Wallet = require("../models/wallet");
const PasswordReset = require("../models/PasswordReset");
const bcrypt = require("bcryptjs");
const ProfileOTP = require("../models/ProfileOTP");
const RegistrationOTP = require("../models/RegistrationOTP");
const jwt = require("jsonwebtoken");
const normalizePhone = require("../utils/phone");
const sendEmail = require("../services/emailService");
const Transaction = require("../models/Transaction");
const Membership = require("../models/Membership");
const SystemSetting = require("../models/SystemSetting");
const { sendPushNotification } = require("../services/firebaseService");
const DeviceToken = require("../models/DeviceToken");
const {
  TOTP,
  NobleCryptoPlugin,
  ScureBase32Plugin
} = require("otplib");






// Purchase membership
const purchaseMembership = async(req,res,next)=>{
  try{

    const MembershipPaymentRequest =
      require("../models/MembershipPaymentRequest");

    const SystemSetting =
      require("../models/SystemSetting");

    const phone =
      normalizePhone(req.user.phone);

    const {tier} = req.body;

    const allowedTiers = ["silver","gold"];

    if(!allowedTiers.includes(tier)){
      throw new AppError(
        "Invalid membership tier",
        400
      );
    }

    const user = await User.findOne({
      phone
    });

    if(!user){
      throw new AppError(
        "User not found",
        404
      );
    }

    const setting =
      await SystemSetting.findOne() ||
      await SystemSetting.create({});

    const prices = {
      silver:Number(setting.membershipSilverPrice || 1000),
      gold:Number(setting.membershipGoldPrice || 2000)
    };

    const amount = prices[tier];

    if(!amount || amount <= 0){
      throw new AppError(
        "Membership price is not configured",
        400
      );
    }

    const existing =
      await MembershipPaymentRequest.findOne({
        phone,
        status:{
          $in:["pending","processing"]
        }
      });

    if(existing){
      throw new AppError(
        "You already have a pending membership payment request",
        400
      );
    }

    const request =
      await MembershipPaymentRequest.create({
        user:user._id,
        phone,
        tier,
        amount,
        status:"pending"
      });

    const {createNotification} =
      require("../services/notificationService");

    await createNotification(
      "admin",
      "New Membership Payment 🔔",
      `${tier.toUpperCase()} membership payment of ₦${amount.toLocaleString()} submitted by ${phone}.`,
      "info"
    );

    // Notify all registered admin devices
    const adminDevices = await DeviceToken.find({
      userType:"admin"
    }).lean();

    await Promise.all(
      adminDevices.map(device =>
        sendPushNotification(
          device.token,
          "New Membership Payment 🔔",
          `${tier.toUpperCase()} membership payment of ₦${amount.toLocaleString()} submitted by ${phone}.`
        )
      )
    );

    const devices = await DeviceToken.find();

    for(const device of devices){

      try{

        await sendPushNotification(
          device.token,
          "New Membership Payment 🔔",
          `${tier.toUpperCase()} membership payment of ₦${amount.toLocaleString()} submitted by ${phone}.`
        );

      }catch(pushError){

        console.error(
          "Membership push notification failed:",
          pushError.message
        );

      }

    }

    res.status(201).json({
      success:true,
      message:"Membership payment submitted for approval",
      request:{
        id:request._id,
        tier:request.tier,
        amount:request.amount,
        status:request.status
      }
    });

  }catch(error){
    next(error);
  }
};


// Send reset OTP
const sendResetOTP = async(req,res,next)=>{

try{

const {email}=req.body;

const user=await User.findOne({
email:email.toLowerCase().trim()
});

if(!user){

throw new AppError("User not found",404);

}

const otp=crypto.randomInt(100000,1000000).toString();

await PasswordReset.deleteMany({
email:user.email
});

await PasswordReset.create({

email:user.email,

otp:hashResetOTP(otp),

expiresAt:new Date(
Date.now()+10*60*1000
)

});

await sendEmail(
user.email,
"AlphaBot Password Reset OTP",
`Your AlphaBot password reset OTP is ${otp}`
);

res.json({

message:"OTP sent successfully"

});

}catch(error){

next(error);

}

};

// Verify reset OTP
const verifyResetOTP = async(req,res,next)=>{

try{

const {
email,
otp,
newPassword
}=req.body;

const cleanEmail=email.toLowerCase().trim();

const reset=await PasswordReset.findOne({

email:cleanEmail

});

if(!reset){

throw new AppError("Invalid OTP",400);

}

if(reset.attempts >= 5){

throw new AppError("Too many OTP attempts",429);

}

if(reset.expiresAt < new Date()){

throw new AppError("OTP expired",400);

}

const otpHash = hashResetOTP(otp);
const otpValid = reset.otp === otpHash || reset.otp === otp;

if(!otpValid){

reset.attempts += 1;

await reset.save();

if(reset.attempts >= 5){

await PasswordReset.deleteOne({
_id:reset._id
});

throw new AppError("Too many OTP attempts",429);

}

throw new AppError("Invalid OTP",400);

}

const user=await User.findOne({

email:cleanEmail

});

if(!user){

throw new AppError("User not found",404);

}

user.password=await bcrypt.hash(
newPassword,
10
);

user.tokenVersion += 1;

await user.save();

await PasswordReset.deleteOne({
_id:reset._id
});

res.json({

message:"Password reset successful"

});

}catch(error){

next(error);

}

};

// Generate referral code
const generateReferralCode = () => {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
};



// Registration OTP
const sendRegistrationOTP = async(req,res,next)=>{
try{

const {name,phone,email,password,referralCode,partner,ref}=req.body;

console.log("REG OTP DATA:", {
  referralCode,
  partner,
  ref
});

if(!name || !phone || !email || !password){
throw new AppError("All fields are required", 400);
}

const cleanPhone = normalizePhone(phone);

const existingUser = await User.findOne({phone:cleanPhone});

if(existingUser){
throw new AppError("User already exists", 400);
}

const hashedPassword = await bcrypt.hash(password,10);

const otp=crypto.randomInt(100000,1000000).toString();

await RegistrationOTP.deleteMany({email:email.toLowerCase().trim()});

await RegistrationOTP.create({
name,
phone:cleanPhone,
email,
password:hashedPassword,
referralCode,
partner: partner || ref,
otp,
expiresAt:new Date(Date.now()+10*60*1000)
});

await sendEmail(
email,
"AlphaBot Registration OTP",
`Your AlphaBot registration OTP is ${otp}`
);

res.json({message:"Registration OTP sent successfully"});

}catch(error){
next(error);
}
};


const verifyRegistrationOTP = async(req,res,next)=>{
try{

const {phone,otp}=req.body;

const cleanPhone=normalizePhone(phone);

const verify = await RegistrationOTP.findOne({
phone:cleanPhone
});

if(!verify){
throw new AppError("Invalid OTP", 400);
}

if(verify.expiresAt < new Date()){
throw new AppError("OTP expired", 400);
}

if(verify.attempts >= 10){
throw new AppError("Too many OTP attempts", 429);
}

if(verify.otp !== String(otp)){
verify.attempts = (verify.attempts || 0) + 1;
await verify.save();

if(verify.attempts >= 10){
throw new AppError("Too many OTP attempts", 429);
}

throw new AppError("Invalid OTP", 400);
}

let wallet = await Wallet.findOne({phone:cleanPhone});

if(!wallet){
wallet = await Wallet.create({
phone:cleanPhone,
balance:0
});
}




const userReferralCode = generateReferralCode();

let validReferralCode=null;

if(verify.referralCode){
const referrer=await User.findOne({
referralCode:verify.referralCode
});

if(referrer){
validReferralCode=verify.referralCode;
}
}

let validBlogPartner = null;

const blogCode = verify.partner || verify.ref || verify.referralCode;

if(blogCode){

const blog = await BlogPartner.findOne({
code: blogCode.toUpperCase(),
status:"active"
});

if(blog){
validBlogPartner = blog._id;
}

}

const user = await User.create({
name:verify.name,
phone:cleanPhone,
email:verify.email,
password:verify.password,
emailVerified:true,
referralCode:userReferralCode,
referredBy:validReferralCode,
blogPartner:validBlogPartner
});

await RegistrationOTP.deleteOne({_id:verify._id});

res.json({
message:"Registration successful",
user:{
id:user._id,
name:user.name,
phone:user.phone,
email:user.email,
referralCode:user.referralCode,
          tokenVersion:user.tokenVersion,
role:user.role
}
});

}catch(error){
next(error);
}
};


// Register
const registerUser = async (req, res, next) => {

  try {


    console.log("REGISTER BODY:", req.body);

const {
      name,
      phone,
      email,
      password,
      referralCode,
      partner,
      ref
    } = req.body;



    const cleanPhone = normalizePhone(phone);

      if(!email){
        throw new AppError("Email is required", 400);
      }



    const existingUser = await User.findOne({
      phone: cleanPhone
    });


    if(existingUser){

      throw new AppError("User already exists", 400);

    }




    let wallet = await Wallet.findOne({
      phone: cleanPhone
    });



    if(!wallet){

      wallet = await Wallet.create({

        phone: cleanPhone,

        balance:0

      });

    }




    const hashedPassword = await bcrypt.hash(
      password,
      10
    );



    let validReferralCode = null;

if(referralCode){

const referrer = await User.findOne({
  referralCode: referralCode
});

if(referrer){

validReferralCode = referralCode;

}

}

let validBlogPartner = null;

const blogCode = partner || ref || referralCode;

if(blogCode){

const blog = await BlogPartner.findOne({
  code: blogCode.toUpperCase(),
  status:"active"
});

if(blog){
  validBlogPartner = blog._id;

  await BlogReferralClick.findOneAndUpdate(
    {
      blogPartner: blog._id,
      code: blogCode.toUpperCase(),
      converted:false
    },
    {
      converted:true
    },
    {
      sort:{
        createdAt:-1
      }
    }
  );
}

}



const userReferralCode = generateReferralCode();




    const user = await User.create({

      name,

      phone: cleanPhone,

      email,

      password: hashedPassword,

      referralCode: userReferralCode,

      referredBy: validReferralCode,

      blogPartner: validBlogPartner

    });



    res.json({

      message:"Registration successful",

      user:{

        id:user._id,

        name:user.name,

        phone:user.phone,

        email:user.email,

        wallet:user.wallet,

        referralCode:user.referralCode,

          tokenVersion:user.tokenVersion,
        role:user.role

      }

    });



  } catch(error){

    next(error);

  }

};





// Login
const loginUser = async (req,res,next)=>{


  try{

    const { phone, password } = req.body || {};



    const cleanPhone = normalizePhone(phone);




    const user = await User.findOne({

      phone: cleanPhone

    });



    if(!user){

      throw new AppError("User not found", 404);

    }




      if(
        user.loginBlockedUntil &&
        user.loginBlockedUntil > new Date()
      ){

        throw new AppError(
          "Too many failed login attempts. Try again later.",
          429
        );

      }

    if(user.status === "suspended"){
      return res.status(403).json({
        message:"Account suspended"
      });
    }

    if(user.status === "deleted"){
      return res.status(403).json({
        message:"Account deleted"
      });
    }



      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );


      if(!passwordMatch){

        user.failedLoginAttempts =
          (user.failedLoginAttempts || 0) + 1;


        if(user.failedLoginAttempts >= 5){

          user.loginBlockedUntil =
            new Date(Date.now() + 15 * 60 * 1000);

        }

        await user.save();

        throw new AppError("Invalid password", 400);

      }


      user.failedLoginAttempts = 0;
      user.loginBlockedUntil = null;
      await user.save();





    const token = jwt.sign(

      {

        id:user._id,

        phone:user.phone,

          tokenVersion:user.tokenVersion,
        role:user.role

      },

      process.env.JWT_SECRET,

      {

        expiresIn:"7d"

      }

    );




    const safeUser = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      wallet: user.wallet
    };

await auditLogger({
actor:user._id.toString(),
role:user.role,
action:"USER_LOGIN_SUCCESS",
target:user.phone,
ip:req.ip,
userAgent:req.headers["user-agent"]
});

    res.json({

      message:"Login successful",
      token,
      user: safeUser
    });



  }catch(error){

    next(error);

  }


};





// Get user profile
const getProfile = async (req,res,next)=>{

  try{

    const user = await User.findOne({
      phone: normalizePhone(req.params.phone)
    }).select("-password");


    if(!user){

      throw new AppError("User not found", 404);

    }


    res.json(user);


  }catch(error){

    next(error);

  }

};



// Update profile
const updateProfile = async (req,res,next)=>{

  try{

    const phone = normalizePhone(req.params.phone);

    const user = await User.findOne({
      phone
    }).select("+twoFactorSecret");

    if(!user){
      throw new AppError("User not found",404);
    }

    const {
      name,
      email,
      otp,
      code
    } = req.body;

    // Authenticator code is used only for verification.
    // It is never saved to the user record.
    const authenticatorCode =
      typeof code === "string" ? code.trim() : "";

    // Require 2FA for profile changes when enabled
    if(user.twoFactorEnabled){

      if(!authenticatorCode){
        throw new AppError(
          "Authenticator code is required",
          400
        );
      }

      if(!user.twoFactorSecret){
        throw new AppError(
          "2FA configuration is invalid",
          400
        );
      }

      const totp = new TOTP({
        crypto: new NobleCryptoPlugin(),
        base32: new ScureBase32Plugin()
      });

      const result = await totp.verify(authenticatorCode,{
        secret:user.twoFactorSecret
      });

      if(!result.valid){
        throw new AppError(
          "Invalid authenticator code",
          400
        );
      }
    }

    // Email changes still require email OTP
    if(email && email !== user.email){

      const verify = await ProfileOTP.findOne({
        phone,
        otp
      });

      if(!verify){
        throw new AppError(
          "Invalid or missing OTP",
          400
        );
      }

      user.email = email;
      user.emailVerified = true;

      await ProfileOTP.deleteOne({
        _id:verify._id
      });
    }

    if(name){
      user.name = name;
    }

    await user.save();

    res.json({
      message:"Profile updated successfully"
    });

  }catch(error){

    next(error);

  }

};


// Change password
const changePassword = async(req,res,next)=>{

  try{

    const phone = normalizePhone(req.params.phone);

    const {
      oldPassword,
      newPassword,
      code
    } = req.body;

    const user = await User.findOne({
      phone
    }).select("+twoFactorSecret");

    if(!user){
      throw new AppError("User not found", 404);
    }

    // Require 2FA for password changes
    if(user.twoFactorEnabled){

      if(!code){
        throw new AppError(
          "Authenticator code is required",
          400
        );
      }

      if(!user.twoFactorSecret){
        throw new AppError(
          "2FA configuration is invalid",
          400
        );
      }

      const totp = new TOTP({
        crypto: new NobleCryptoPlugin(),
        base32: new ScureBase32Plugin()
      });

      const result = await totp.verify(code, {
        secret: user.twoFactorSecret
      });

      if(!result.valid){
        throw new AppError(
          "Invalid authenticator code",
          400
        );
      }
    }

    const match = await bcrypt.compare(
      oldPassword,
      user.password
    );

    if(!match){
      throw new AppError(
        "Old password is incorrect",
        400
      );
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    user.tokenVersion += 1;

    await user.save();

    res.json({
      message:"Password changed successfully"
    });

  }catch(error){

    next(error);

  }

};

const sendProfileOTP = async(req,res,next)=>{
try{

const {email}=req.body;

const cleanEmail=email.toLowerCase().trim();

const user = await User.findOne({
email:cleanEmail
});

if(!user){
throw new AppError("User not found",404);
}

const otp=crypto.randomInt(100000,1000000).toString();

await ProfileOTP.deleteMany({
email:cleanEmail
});

await ProfileOTP.create({
phone:user.phone,
email:cleanEmail,
otp,
expiresAt:new Date(Date.now()+10*60*1000)
});

await sendEmail(
user.email,
"AlphaBot Profile Verification OTP",
`Your AlphaBot profile verification OTP is ${otp}`
);

res.json({
message:"Profile OTP sent successfully"
});

}catch(error){
next(error);
}

};


const verifyProfileOTP = async(req,res,next)=>{
try{

const {
email,
otp
}=req.body;

const cleanEmail=email.toLowerCase().trim();

const verify = await ProfileOTP.findOne({
email:cleanEmail,
otp
});

if(!verify){

throw new AppError("Invalid OTP",400);

}

if(verify.attempts >= 5){

throw new AppError("Too many OTP attempts",429);

}

if(verify.expiresAt < new Date()){

throw new AppError("OTP expired",400);

}

const user = await User.findOne({
email:cleanEmail
});

if(user){

user.emailVerified = true;

await user.save();

}

await ProfileOTP.deleteOne({
_id:verify._id
});

res.json({
message:"Profile verified successfully"
});

}catch(error){

next(error);

}

};


const saveWithdrawAccount = async(req,res,next)=>{
try{

const {
phone,
withdrawBankName,
withdrawBankCode,
withdrawAccountNumber,
withdrawAccountName,
pin
}=req.body;


const User = require("../models/User");
const TransactionPin = require("../models/TransactionPin");


const user = await User.findOne({phone});


if(!user){
throw new AppError("User not found", 404);
}


const userPin = await TransactionPin.findOne({phone});


if(!userPin || !(await bcrypt.compare(pin,userPin.pin))){
throw new AppError("Invalid transaction PIN", 400);
}


user.withdrawBankName = withdrawBankName;
user.withdrawBankCode = withdrawBankCode;
user.withdrawAccountNumber = withdrawAccountNumber;
user.withdrawAccountName = withdrawAccountName;


await user.save();


res.json({
message:"Withdrawal account saved successfully"
});


}catch(error){

next(error);

}

};


const getWithdrawAccount = async(req,res,next)=>{
try{

const User = require("../models/User");

const user = await User.findOne({phone:req.params.phone});

res.json({
withdrawBankName:user?.withdrawBankName || null,
withdrawBankCode:user?.withdrawBankCode || null,
withdrawAccountNumber:user?.withdrawAccountNumber || null,
withdrawAccountName:user?.withdrawAccountName || null
});

}catch(error){
next(error);
}
};





const deleteOwnAccount = async (req,res,next)=>{
  try{

    const {
      password,
      reason
    } = req.body;

    if(!password){
      throw new AppError(
        "Password is required",
        400
      );
    }

    const user = await User.findById(
      req.user.id
    );

    if(!user){
      throw new AppError(
        "User not found",
        404
      );
    }

    if(!user.password){
      throw new AppError(
        "This account does not have a login password. Please contact support.",
        400
      );
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if(!passwordMatch){
      throw new AppError(
        "Incorrect password",
        400
      );
    }

    user.status = "deleted";
    user.deletedAt = new Date();
    user.deletionReason =
      typeof reason === "string"
        ? reason.trim().slice(0, 1000) || null
        : null;

    // Revoke every existing login token.
    user.tokenVersion += 1;

    await user.save();

    res.json({
      success:true,
      message:"Account deleted successfully"
    });

  }catch(error){
    next(error);
  }
};



const getAccountTier = async(req,res,next)=>{
  try{
    const phone = normalizePhone(req.user.phone);

    const user = await User.findOne({phone})
      .select("accountTier accountTierExpiresAt");

    if(!user){
      throw new AppError("User not found",404);
    }

    res.json({
      success:true,
      accountTier:user.accountTier || "normal",
      accountTierExpiresAt:user.accountTierExpiresAt || null
    });

  }catch(error){
    next(error);
  }
};

// Logout from all devices by revoking every existing JWT.
const logoutUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.tokenVersion += 1;

    await user.save();

    res.json({
      message: "Logged out from all devices successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccountTier,
  purchaseMembership,

  registerUser,

  loginUser,


  sendResetOTP,

  verifyResetOTP,

  getProfile,

  updateProfile,

  changePassword,

  logoutUser,

  sendProfileOTP,

  verifyProfileOTP,
    sendRegistrationOTP,
    verifyRegistrationOTP,
  saveWithdrawAccount,
  deleteOwnAccount,


  getWithdrawAccount,

};
