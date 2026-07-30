const jwt = require("jsonwebtoken");
const User = require("../models/User");


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
      process.env.JWT_SECRET || "alphabotsecret"
    );


    const user = await User.findById(decoded.id);


    if(
      !user ||
      user.tokenVersion !== decoded.tokenVersion
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
