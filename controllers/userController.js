const User = require("../models/User");
const Wallet = require("../models/wallet");
const PasswordReset = require("../models/PasswordReset");
const bcrypt = require("bcryptjs");
const ProfileOTP = require("../models/ProfileOTP");
const RegistrationOTP = require("../models/RegistrationOTP");
const jwt = require("jsonwebtoken");
const normalizePhone = require("../utils/phone");
const sendEmail = require("../services/emailService");





// Send reset OTP
const sendResetOTP = async(req,res)=>{

try{

const {phone}=req.body;

const user=await User.findOne({
phone:normalizePhone(phone)
});


if(!user){

return res.status(404).json({
message:"User not found"
});

}


const otp=Math.floor(
100000 + Math.random()*900000
).toString();


await PasswordReset.deleteMany({
phone:user.phone
});


await PasswordReset.create({

phone:user.phone,

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

res.status(500).json({
message:error.message
});

}

};



// Verify reset OTP
const verifyResetOTP = async(req,res)=>{

try{

const {
phone,
otp,
newPassword
}=req.body;


const reset=await PasswordReset.findOne({

phone:normalizePhone(phone),

otp

});


if(!reset){

return res.status(400).json({

message:"Invalid OTP"

});

}


if(reset.expiresAt < new Date()){

return res.status(400).json({

message:"OTP expired"

});

}


const user=await User.findOne({

phone:normalizePhone(phone)

});


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

res.status(500).json({
message:error.message
});

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
const sendRegistrationOTP = async(req,res)=>{
try{

const {name,phone,email,password,referralCode}=req.body;

if(!name || !phone || !email || !password){
return res.status(400).json({message:"All fields are required"});
}

const cleanPhone = normalizePhone(phone);

const existingUser = await User.findOne({phone:cleanPhone});

if(existingUser){
return res.status(400).json({message:"User already exists"});
}

const hashedPassword = await bcrypt.hash(password,10);

const otp=Math.floor(100000 + Math.random()*900000).toString();

await RegistrationOTP.deleteMany({phone:cleanPhone});

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
res.status(500).json({message:error.message});
}
};


const verifyRegistrationOTP = async(req,res)=>{
try{

const {phone,otp}=req.body;

const cleanPhone=normalizePhone(phone);

const verify = await RegistrationOTP.findOne({
phone:cleanPhone,
otp
});

if(!verify){
return res.status(400).json({message:"Invalid OTP"});
}

if(verify.expiresAt < new Date()){
return res.status(400).json({message:"OTP expired"});
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
role:user.role
}
});

}catch(error){
res.status(500).json({message:error.message});
}
};


// Register
const registerUser = async (req, res) => {

  try {


    const {
      name,
      phone,
      email,
      password,
      referralCode
    } = req.body;



    const cleanPhone = normalizePhone(phone);

      if(!email){
        return res.status(400).json({
          message:"Email is required"
        });
      }



    const existingUser = await User.findOne({
      phone: cleanPhone
    });


    if(existingUser){

      return res.status(400).json({
        message:"User already exists"
      });

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

const userReferralCode = generateReferralCode();




    const user = await User.create({

      name,

      phone: cleanPhone,

      email,

      password: hashedPassword,

      referralCode: userReferralCode,

      referredBy: validReferralCode

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

        role:user.role

      }

    });



  } catch(error){

    res.status(500).json({

      message:error.message

    });

  }

};





// Login
const loginUser = async (req,res)=>{


    console.log("LOGIN ROUTE HIT");
  try{

    const { phone, password } = req.body || {};



    const cleanPhone = normalizePhone(phone);




    console.log("Login DB state:", require("mongoose").connection.readyState);
    const user = await User.findOne({

      phone: cleanPhone

    });



    if(!user){

      return res.status(404).json({

        message:"User not found"

      });

    }




    const passwordMatch = await bcrypt.compare(

      password,

      user.password

    );



    if(!passwordMatch){

      return res.status(400).json({

        message:"Invalid password"

      });

    }





    const token = jwt.sign(

      {

        id:user._id,

        phone:user.phone,

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

    res.json({
      message:"Login successful",
      token,
      user: safeUser
    });



  }catch(error){

    res.status(500).json({

      message:error.message

    });

  }


};





// Forgot password
const forgotPassword = async(req,res)=>{


  try{


    const {
      phone,
      newPassword
    } = req.body;



    const cleanPhone = normalizePhone(phone);

      if(!email){
        return res.status(400).json({
          message:"Email is required"
        });
      }



    const user = await User.findOne({

      phone: cleanPhone

    });



    if(!user){

      return res.status(404).json({

        message:"User not found"

      });

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


    res.status(500).json({

      message:error.message

    });

  }


};








// Get user profile
const getProfile = async (req,res)=>{

  try{

    const user = await User.findOne({
      phone: normalizePhone(req.params.phone)
    }).select("-password");


    if(!user){

      return res.status(404).json({
        message:"User not found"
      });

    }


    res.json(user);


  }catch(error){

    res.status(500).json({
      message:error.message
    });

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

      return res.status(404).json({
        message:"User not found"
      });

    }


      const {
        name,
        email,
        otp
      } = req.body;

      if(email && email !== user.email){

        const verify = await ProfileOTP.findOne({
          phone,
          otp
        });

        if(!verify){
          return res.status(400).json({
            message:"Invalid or missing OTP"
          });
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

    res.status(500).json({
      message:error.message
    });

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

      return res.status(404).json({
        message:"User not found"
      });

    }


    const match = await bcrypt.compare(
      oldPassword,
      user.password
    );


    if(!match){

      return res.status(400).json({
        message:"Old password is incorrect"
      });

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

    res.status(500).json({
      message:error.message
    });

  }

};



const sendProfileOTP = async(req,res)=>{
try{

const {phone}=req.body;

const user = await User.findOne({
phone:normalizePhone(phone)
});

if(!user){
return res.status(404).json({message:"User not found"});
}

const otp=Math.floor(100000 + Math.random()*900000).toString();

await ProfileOTP.deleteMany({phone:user.phone});

await ProfileOTP.create({
phone:user.phone,
otp,
expiresAt:new Date(Date.now()+10*60*1000)
});

await sendEmail(
user.email,
"AlphaBot Profile Verification OTP",
`Your AlphaBot profile verification OTP is ${otp}`
);

res.json({message:"Profile OTP sent successfully"});

}catch(error){
res.status(500).json({message:error.message});
}
};


const verifyProfileOTP = async(req,res)=>{
try{

const {phone,otp}=req.body;

const verify = await ProfileOTP.findOne({
phone:normalizePhone(phone),
otp
});

if(!verify){
return res.status(400).json({message:"Invalid OTP"});
}

if(verify.expiresAt < new Date()){
return res.status(400).json({message:"OTP expired"});
}

await ProfileOTP.deleteOne({_id:verify._id});

res.json({message:"Profile verified successfully"});

}catch(error){
res.status(500).json({message:error.message});
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
    verifyRegistrationOTP

};
