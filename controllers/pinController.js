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
return res.status(404).json({message:"User not found"});
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

      return res.status(400).json({
        message:"PIN and OTP are required"
      });

    }


    if(pin.length !== 4){

      return res.status(400).json({
        message:"PIN must be 4 digits"
      });

    }


    const cleanPhone = normalizePhone(req.user.phone);


      const otpRecord = await ProfileOTP.findOne({
        phone: cleanPhone,
        otp
      });

      if(!otpRecord || otpRecord.expiresAt < new Date()){
        return res.status(400).json({
          message:"Invalid or expired OTP"
        });
      }

      await ProfileOTP.deleteOne({
        _id: otpRecord._id
      });


    let userPin = await TransactionPin.findOne({
      phone: cleanPhone
    });


    if(userPin){

      userPin.pin = pin;
      userPin.updatedAt = Date.now();

      await userPin.save();

      return res.json({
        message:"Transaction PIN updated successfully"
      });

    }


    await TransactionPin.create({
      phone: cleanPhone,
      pin
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

      return res.status(404).json({
        message:"Transaction PIN not created"
      });

    }


    if(userPin.pin !== pin){

      return res.status(400).json({
        message:"Incorrect transaction PIN"
      });

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
  checkPinStatus,
  checkPinStatus
};