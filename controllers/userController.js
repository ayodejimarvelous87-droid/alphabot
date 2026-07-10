const User = require("../models/User");
const Wallet = require("../models/wallet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const registerUser = async (req, res) => {
  try {

    const { name, phone, email, password } = req.body;


    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }


    let wallet = await Wallet.findOne({ phone });


    if (!wallet) {
      wallet = await Wallet.create({
        phone,
        balance: 0
      });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const user = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      wallet: wallet._id
    });


    res.json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        wallet: user.wallet,
        role: user.role
      }
    });


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



const loginUser = async (req, res) => {
  try {

    const { phone, password } = req.body;


    const user = await User.findOne({ phone });


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );


    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }



    const token = jwt.sign(
      {
        id: user._id,
        phone: user.phone,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );



    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        wallet: user.wallet,
        role: user.role
      }
    });


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



module.exports = {
  registerUser,
  loginUser
};
