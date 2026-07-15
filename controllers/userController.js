const User = require("../models/User");
const Wallet = require("../models/wallet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const normalizePhone = require("../utils/phone");


// Generate referral code
const generateReferralCode = () => {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
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



    const userReferralCode = generateReferralCode();




    const user = await User.create({

      name,

      phone: cleanPhone,

      email,

      password: hashedPassword,

      wallet: wallet._id,

      referralCode: userReferralCode,

      referredBy: referralCode || null

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


    const {
      phone,
      password
    } = req.body;



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




    res.json({

      message:"Login successful",

      token,

      user

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
      email
    } = req.body;


    if(name) user.name = name;

    if(email) user.email = email;


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



module.exports = {

  registerUser,

  loginUser,

  forgotPassword,

  getProfile,

  updateProfile,

  changePassword

};
