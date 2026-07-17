const Wallet = require("../models/wallet");
const User = require("../models/User");

const getWelcomeMessage = async (phone) => {

  const user = await User.findOne({ phone });

  const wallet = await Wallet.findOne({ phone });


  return `
━━━━━━━━━━━━━━━━
🤖 ALPHABOT DASHBOARD
━━━━━━━━━━━━━━━━

Welcome back, ${user?.name || "ALPHA"} 👋

💰 Wallet: ₦${wallet?.balance || 0}

🎁 Referral Earnings: ₦${user?.referralEarnings || 0}

🎖️ Status: ${user ? "Active" : "New User"}
`;

};


module.exports = {
  getWelcomeMessage
};
