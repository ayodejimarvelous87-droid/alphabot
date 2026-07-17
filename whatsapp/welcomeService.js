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

Choose an option:

1️⃣ Wallet 💰
2️⃣ Services 🛒
3️⃣ Referral 🎁
4️⃣ Rewards 🏆
5️⃣ Games 🎮
6️⃣ AI Assistant 🧠
7️⃣ Support 📞

Reply with a number.
`;

};


module.exports = {
  getWelcomeMessage
};
