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

const otp=Math.floor(
100000 + Math.random()*900000
).toString();

await PasswordReset.deleteMany({
email:user.email
});

await PasswordReset.create({

email:user.email,

otp,

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

email:cleanEmail,

otp

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

const {name,phone,email,password,referralCode}=req.body;

if(!name || !phone || !email || !password){
throw new AppError("All fields are required", 400);
}

const cleanPhone = normalizePhone(phone);

const existingUser = await User.findOne({phone:cleanPhone});

if(existingUser){
throw new AppError("User already exists", 400);
}

const hashedPassword = await bcrypt.hash(password,10);

const otp=Math.floor(100000 + Math.random()*900000).toString();

await RegistrationOTP.deleteMany({email:email.toLowerCase().trim()});

await RegistrationOTP.create({
name,
phone:cleanPhone,
email,
password:hashedPassword,
referralCode,
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
phone:cleanPhone,
otp
});
if(verify.attempts >= 5){
throw new AppError("Too many OTP attempts", 429);
}


if(!verify){
throw new AppError("Invalid OTP", 400);
}

if(verify.expiresAt < new Date()){
throw new AppError("OTP expired", 400);
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

const user = await User.create({
name:verify.name,
phone:cleanPhone,
email:verify.email,
password:verify.password,
emailVerified:true,
referralCode:userReferralCode,
referredBy:validReferralCode
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

const blogCode = partner || ref;

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


    console.log("LOGIN ROUTE HIT");
  try{

    const { phone, password } = req.body || {};



    const cleanPhone = normalizePhone(phone);




    console.log("Login DB state:", require("mongoose").connection.readyState);
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





// Forgot password
const forgotPassword = async(req,res,next)=>{


  try{


    const {
      phone,
      newPassword
    } = req.body;



    const cleanPhone = normalizePhone(phone);

      if(!email){
        throw new AppError("Email is required", 400);
      }



    const user = await User.findOne({

      phone: cleanPhone

    });



    if(!user){

      throw new AppError("User not found", 404);

    }




    user.password = await bcrypt.hash(

      newPassword,

      10

    );



    await user.save();



    res.json({

      message:"Password reset successful"

    });



  }catch(error){


    next(error);

  }


};








// Get user profile
const getProfile = async (req,res)=>{

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
const updateProfile = async (req,res)=>{

  try{

    const phone = normalizePhone(req.params.phone);


    const user = await User.findOne({
      phone
    });


    if(!user){

      throw new AppError("User not found", 404);

    }


      const {
        name,
        email,
        otp
      } = req.body;

      if(email && email !== user.email){
if(verify && verify.attempts >= 5){
return res.status(429).json({
message:"Too many OTP attempts"
});
}


        const verify = await ProfileOTP.findOne({
          phone,
          otp
        });

        if(!verify){
          throw new AppError("Invalid or missing OTP", 400);
        }


const user = await User.findOne({phone:normalizePhone(phone)});

if(user){
  user.emailVerified = true;
  await user.save();
}

        await ProfileOTP.deleteOne({_id:verify._id});
        user.email = email;
      }

      if(name) user.name = name;

    await user.save();


    res.json({
      message:"Profile updated successfully"
    });


  }catch(error){

    next(error);

  }

};



// Change password
const changePassword = async (req,res)=>{

  try{

    const phone = normalizePhone(req.params.phone);


    const {
      oldPassword,
      newPassword
    } = req.body;


    const user = await User.findOne({
      phone
    });


    if(!user){

      throw new AppError("User not found", 404);

    }


    const match = await bcrypt.compare(
      oldPassword,
      user.password
    );


    if(!match){

      throw new AppError("Old password is incorrect", 400);

    }


    user.password = await bcrypt.hash(
      newPassword,
      10
    );


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

const otp=Math.floor(100000 + Math.random()*900000).toString();

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



const deleteOwnAccount = async (req,res)=>{
  try{

    const phone = req.user.phone;

    const User = require("../models/User");

    await User.findOneAndUpdate(
      {phone},
      {
        status:"deleted",
        deletedAt:new Date()
      }
    );

    res.json({
      success:true,
      message:"Account deleted successfully"
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};


module.exports = {

  registerUser,

  loginUser,

  forgotPassword,

  sendResetOTP,

  verifyResetOTP,

  getProfile,

  updateProfile,

  changePassword,

  sendProfileOTP,

  verifyProfileOTP,
    sendRegistrationOTP,
    verifyRegistrationOTP,
  saveWithdrawAccount,
  deleteOwnAccount,

  getWithdrawAccount,

};
