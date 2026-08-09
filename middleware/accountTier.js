const User = require("../models/User");

const normalizeAccountTier = async(req,res,next)=>{
  try{

    if(!req.user?.phone){
      return next();
    }

    const user = await User.findOne({
      phone:req.user.phone
    }).select(
      "_id accountTier accountTierExpiresAt"
    );

    if(!user){
      return next();
    }

    if(
      user.accountTier !== "normal" &&
      user.accountTierExpiresAt &&
      new Date(user.accountTierExpiresAt) <= new Date()
    ){

      user.accountTier = "normal";
      user.accountTierExpiresAt = null;

      await user.save();

      req.user.accountTier = "normal";
      req.user.accountTierExpiresAt = null;

    }else{

      req.user.accountTier = user.accountTier;
      req.user.accountTierExpiresAt =
        user.accountTierExpiresAt;

    }

    next();

  }catch(error){
    next(error);
  }
};

module.exports = normalizeAccountTier;
