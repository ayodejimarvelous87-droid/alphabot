const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");


const auth = async (req, res, next) => {

  const authHeader = req.headers.authorization;


  if (!authHeader) {
    return res.status(401).json({
      message:"No token provided"
    });
  }


  const token = authHeader.split(" ")[1];


  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    let account;

    if(decoded.role === "admin"){

      // Original Admin account
      account = await Admin.findById(decoded.id);

      // Upgraded User account
      if(!account){
        account = await User.findOne({
          _id: decoded.id,
          role: "admin"
        });
      }

    }else{

      account = await User.findById(decoded.id);

    }


      // Block suspended/deleted upgraded User admins
      if(
        decoded.role === "admin" &&
        account &&
        account.constructor.modelName === "User" &&
        account.status !== "active"
      ){

        return res.status(403).json({
          message:
            account.status === "suspended"
              ? "Account suspended"
              : "Account deleted"
        });
      }


    if(
      !account ||
      account.tokenVersion !== decoded.tokenVersion
    ){

      return res.status(401).json({
        message:"Token revoked"
      });

    }


    req.user = decoded;

    next();


  } catch(error){

    return res.status(401).json({
      message:"Invalid token"
    });

  }

};


module.exports = auth;
