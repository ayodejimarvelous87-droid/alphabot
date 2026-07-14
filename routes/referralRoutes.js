const express = require("express");
const router = express.Router();

const User = require("../models/User");


// Get referral info
router.get("/:phone", async (req, res) => {

  try {

    const user = await User.findOne({
      phone: req.params.phone
    });


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    const referrals = await User.countDocuments({
      referredBy: user.referralCode
    });


    res.json({

      referralCode: user.referralCode,

      referralLink:
      `https://alphabot.com/register?ref=${user.referralCode}`,

      totalReferrals: referrals,

      earnings: user.referralEarnings

    });


  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }

});


module.exports = router;
