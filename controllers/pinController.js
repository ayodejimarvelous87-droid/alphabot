const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const TransactionPin = require("../models/TransactionPin");
const ProfileOTP = require("../models/ProfileOTP");
const User = require("../models/User");
const sendEmail = require("../services/emailService");
const normalizePhone = require("../utils/phone");



const sendPinOTP = async(req,res)=>{
console.log("SEND PIN OTP REQUEST:", req.body, req.user);
try{

const {phone}=req.body;

const cleanPhone = normalizePhone(req.user.phone);

const user = await User.findOne({
phone:cleanPhone
});

if(!user){
throw new AppError(
  "User not found",
  404
);
}

const otp=Math.floor(100000 + Math.random()*900000).toString();

await ProfileOTP.deleteMany({phone:cleanPhone});

await ProfileOTP.create({
phone:cleanPhone,
otp,
expiresAt:new Date(Date.now()+10*60*1000)
});

await sendEmail(
user.email,
"AlphaBot Transaction PIN OTP",
`Your AlphaBot transaction PIN OTP is ${otp}`
);

res.json({message:"Transaction PIN OTP sent successfully"});

}catch(error){
res.status(500).json({message:error.message});
}
};

// Create or update PIN
const setPin = async(req,res)=>{

  try{

    const {
        pin,
        otp
      } = req.body;


    if(!pin || !otp){

      throw new AppError(
  "PIN and OTP are required",
  400
);

    }


    if(pin.length !== 4){

      throw new AppError(
  "PIN must be 4 digits",
  400
);

    }


    const cleanPhone = normalizePhone(req.user.phone);


      const otpRecord = await ProfileOTP.findOne({
        phone: cleanPhone,
        otp
      });

if(otpRecord && otpRecord.attempts >= 5){
return res.status(429).json({
message:"Too many OTP attempts"
});
}

      if(!otpRecord || otpRecord.expiresAt < new Date()){
        throw new AppError(
  "Invalid or expired OTP",
  400
);
      }

      await ProfileOTP.deleteOne({
        _id: otpRecord._id
      });


    let userPin = await TransactionPin.findOne({
      phone: cleanPhone
    });


    if(userPin){

      userPin.pin = await bcrypt.hash(pin,10);
      userPin.updatedAt = Date.now();

      await userPin.save();

      return res.json({
        message:"Transaction PIN updated successfully"
      });

    }


    await TransactionPin.create({
      phone: cleanPhone,
      pin: await bcrypt.hash(pin,10)
    });


    res.json({
      message:"Transaction PIN created successfully"
    });


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }

};


// Verify PIN
const verifyPin = async(req,res)=>{

  try{

    const {
        phone,
        pin,
        otp
      } = req.body;


    const cleanPhone = normalizePhone(req.user.phone);


    const userPin = await TransactionPin.findOne({
      phone: cleanPhone
    });


    if(!userPin){

      throw new AppError(
  "Transaction PIN not created",
  404
);

    }


    if(!(await bcrypt.compare(pin,userPin.pin))){

      throw new AppError(
  "Incorrect transaction PIN",
  400
);

    }


    res.json({
      message:"PIN verified",
      success:true
    });


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }

};



const checkPinStatus = async(req,res)=>{
try{

const cleanPhone = normalizePhone(req.user.phone);

const userPin = await TransactionPin.findOne({
phone:cleanPhone
});

res.json({
hasPin:!!userPin
});

}catch(error){
res.status(500).json({
message:error.message
});
}
};

module.exports = {
    sendPinOTP,
  setPin,
  verifyPin,
  checkPinStatus
};
