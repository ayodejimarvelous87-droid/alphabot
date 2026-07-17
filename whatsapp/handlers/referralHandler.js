const User = require("../../models/User");

const handleReferral = async ({
  phone,
  text,
  sendMessage
}) => {


  const user = await User.findOne({ phone });


  if (!user) {

    await sendMessage(
      phone,
      "❌ User account not found."
    );

    return true;

  }


  if (
    text === "ref bal" ||
    text === "ref earnings" ||
    text === "referral earnings"
  ) {

    await sendMessage(
      phone,
      `🔗 Referral Earnings: ₦${user.referralEarnings || 0}\n\nInvite more users and earn more rewards.`
    );

    return true;

  }


  if (
    text === "ref" ||
    text === "referral" ||
    text === "my referral" ||
    text === "my referral code"
  ) {


    const link =
    `https://wa.me/?text=Join%20AlphaBot%20and%20enjoy%20amazing%20services.%20Use%20my%20referral%20code:%20${user.referralCode}`;


    await sendMessage(
      phone,
      `🔗 Your AlphaBot Referral Code:\n\n${user.referralCode}\n\nShare this link with friends:\n${link}\n\nEarn rewards when they use AlphaBot.`
    );


    return true;

  }


  return false;

};


module.exports = {
  handleReferral
};
