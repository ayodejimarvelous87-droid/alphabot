const { walletMenu, serviceMenu, referralMenu, rewardMenu, gameMenu } = require("./menus");
const { getWelcomeMessage } = require("./welcomeService");
const { sendMessage, sendButtons, sendMenu, sendList } = require("./whatsappService");
const { helpMessage } = require("./help");
const User = require("../models/User");
const Wallet = require("../models/wallet");
const UserState = require("../models/UserState");
const { handleAirtime } = require("./handlers/airtimeHandler");
const { handleData } = require("./handlers/dataHandler");
const { handleWallet } = require("./handlers/walletHandler");
const { handleExam } = require("./handlers/examHandler");
const { handleRecurring } = require("./handlers/recurringHandler");
const { handleReferral } = require("./handlers/referralHandler");
const { handleAI } = require("./handlers/aiHandler");
const { handleWithdrawal } = require("./handlers/withdrawalHandler");
const { handleAirtimeCash } = require("./handlers/airtimeCashHandler");
const { handleBeneficiary } = require("./handlers/beneficiaryHandler");
const { handleElectricity } = require("./handlers/electricityHandler");
const { handleTV } = require("./handlers/tvHandler");
const { handleBetting } = require("./handlers/bettingHandler");


const handleMessage = async (phone, message) => {

  const text = message.toLowerCase().trim();

    const menuMap = {
      "💰 wallet": "1",
      "🛒 services": "2",
      "🎁 referral": "3",
      "👥 beneficiary": "4",
      "💵 airtime cash": "5",
      "💸 withdrawal": "6",
      "🔁 recurring payments": "7",
      "🤖 ai assistant": "8",
      "🏆 rewards": "9",
      "🎮 games": "10",
      "📞 support": "11"
    };

    const command = menuMap[text] || text;


  let user = await User.findOne({ phone });


    if (!user) {

      if (state && state.state === "awaiting_signup_name") {

        const wallet = await Wallet.create({
          phone,
          balance: 0
        });

        user = await User.create({
          name: message,
          phone,
          wallet: wallet._id,
          referralCode: "AB" + Date.now()
        });

        state.state = null;
        state.data = {};
        await state.save();

        await sendMessage(phone, "✅ Account created successfully! Send Hi to open AlphaBot menu.");

        return;
      }

      state.state = "awaiting_signup_name";
      await state.save();

      await sendMessage(phone, "👋 Welcome to AlphaBot 🚀\n\nPlease enter your name to create your account.");

      return;
    }


  let state = await UserState.findOne({ phone });


  if (!state) {

    state = await UserState.create({
      phone,
      state: null,
      data: {}
    });
  }

    if (text === "⬅️ back" || text === "back") {

      state.state = null;
      state.data = {};

      await state.save();

      const welcome = await getWelcomeMessage(phone);

      await sendMenu(phone, welcome, [
        "💰 Wallet",
        "🛒 Services",
        "🎁 Referral",
        "👥 Beneficiary",
        "💵 Airtime Cash",
        "💸 Withdrawal",
        "🔁 Recurring Payments",
        "🤖 AI Assistant",
        "🏆 Rewards",
        "🎮 Games",
        "📞 Support"
      ]);

      return;

    }






    if (state.state === "services_menu") {

      if (text === "1" || text.includes("data")) {
        state.state = "awaiting_data_network";
        await state.save();
        await sendMessage(phone, "🌐 Enter network (MTN, Airtel, Glo, 9mobile):");
        return true;
      }

      if (text === "2" || text.includes("airtime")) {
        state.state = "awaiting_airtime_option";
        await state.save();
        await sendMessage(phone, "📱 Choose Airtime option:\n\n1. New Number\n2. Saved Beneficiary");
        return true;
      }

        if (text === "3" || text.includes("electricity")) {
          state.state = "awaiting_disco";
          state.data = {};
          await state.save();

          await sendButtons(phone, "⚡ Select DISCO:", [
            "IKEDC",
            "EKEDC",
            "AEDC",
            "PHED",
            "BACK"
          ]);

          return true;
        }

      if (text === "4" || text.includes("tv")) {
        state.state = "awaiting_tv_provider";
        await state.save();
        await sendMessage(phone, "📺 Enter TV provider:");
        return true;
      }

      if (text === "5" || text.includes("exam")) {
        state.state = "awaiting_exam_type";
        await state.save();
        await sendMessage(phone, "🎓 Enter exam type:");
        return true;
      }

      if (text === "6" || text.includes("betting")) {
        state.state = "awaiting_betting_provider";
        await state.save();
        await sendMessage(phone, "🎮 Enter betting platform:");
        return true;
      }

      if (text === "0" || text === "back") {
        state.state = null;
        state.data = {};
        await state.save();

        const welcome = await getWelcomeMessage(phone);
        await sendMessage(phone, welcome);
        return true;
      }

      await sendMessage(phone, "❌ Invalid service option. Choose 1 - 6 or 0 to go back.");
      return true;
    }
    const handledAirtime = await handleAirtime({

    phone,
    text,
    message,
    state,
    sendMessage,
    sendButtons
  });

  if (handledAirtime) return;

  const handledData = await handleData({
    phone,
    text,
    state,
    message,
    sendMessage
  });

  if (handledData) return;


    const handledElectricity = await handleElectricity({
      phone,
      text,
      message,
      state,
      sendMessage,
      sendButtons
    });

    if (handledElectricity) return;

    const handledTV = await handleTV({
      phone,
      text,
      message,
      state,
      sendMessage,
      sendButtons
    });

    if (handledTV) return;


    const handledBetting = await handleBetting({
      phone,
      text,
      message,
      state,
      sendMessage,
      sendButtons
    });

    if (handledBetting) return;


  const handledWallet = await handleWallet({
    phone,
    text,
    state,
    sendMessage
  });

  if (handledWallet) return;

  const handledExam = await handleExam({
    phone,
    text,
    message,
    state,
    sendMessage,
    sendButtons
  });

  if (handledExam) return;

  const handledRecurring = await handleRecurring({
    phone,
    text,
    message,
    state,
    sendMessage,
    sendButtons
  });

  if (handledRecurring) return;

  const handledReferral = await handleReferral({
    phone,
    text,
    sendMessage
  });

  if (handledReferral) return;

  const handledWithdrawal = await handleWithdrawal({
    phone,
    text,
    state,
    sendMessage
  });

  if (handledWithdrawal) return;

  const handledAirtimeCash = await handleAirtimeCash({


    phone,
    text,
    state,
    sendMessage
  });

  if (handledAirtimeCash) return;

  const handledBeneficiary = await handleBeneficiary({
    phone,
    text,
    state,
    sendMessage
  });

  if (handledBeneficiary) return;












    if (text === "ai off") {

      state.state = null;
      state.data = {};

      await state.save();

      await sendMessage(
        phone,
          "🤖 AI mode disabled.\n\nSend Hi to return to the main menu."
      );

      return;

    }




    if (text === "hi" || text === "hello" || text === "start" || text === "menu" || text === "back") {

    state.state = null;
    state.data = {};

    await state.save();


        const welcome = await getWelcomeMessage(phone);

        await sendMessage(
          phone,
          welcome + `

1. 💰 Wallet
2. 🛒 Services
3. 🎁 Referral
4. 👥 Beneficiary
5. 💵 Airtime Cash
6. 💸 Withdrawal
7. 🔁 Recurring Payments
8. 🤖 AI Assistant
9. 🏆 Rewards
10. 🎮 Games
11. 📞 Support

Reply with a number.`
        );

    return;
  }




      if (command === "0") {

        state.state = null;
        state.data = {};
        await state.save();

        const welcome = await getWelcomeMessage(phone);

        await sendMessage(phone, welcome + `

1. 💰 Wallet
2. 🛒 Services
3. 🎁 Referral
4. 👥 Beneficiary
5. 💵 Airtime Cash
6. 💸 Withdrawal
7. 🔁 Recurring Payments
8. 🤖 AI Assistant
9. 🏆 Rewards
10. 🎮 Games
11. 📞 Support

Reply with a number.`);

        return;

      }

        if (command === "1") {

          state.state = "wallet_menu";
          await state.save();

          await sendButtons(phone, "💰 Wallet", [
            "Check Balance",
            "Fund Wallet",
            "Transaction History",
            "BACK"
          ]);

          return;

        }





      if (command === "2") {

        state.state = "services_menu";
        state.data = {};
        await state.save();

        await sendList(phone, "🛒 Services", [
          "🌐 Data",
          "📱 Airtime",
          "⚡ Electricity",
          "📺 TV Subscription",
          "🎓 Exam PIN",
          "🎮 Betting",
          "BACK"
        ]);

        return;

      }

    if (command === "3") {

      await sendButtons(phone, "🎁 Referral", [
        "My Referral Code",
        "Referral Earnings",
          "BACK"
      ]);

      return;

    }


      if (command === "4") {

        await sendButtons(phone, "👥 Beneficiary Menu", ["Add Beneficiary", "My Beneficiaries", "BACK"]);

        return;

      }

      if (command === "5") {

        await sendButtons(phone, "💵 Airtime Cash Menu", ["Request Airtime Cash", "BACK"]);

        return;

      }

      if (command === "6") {

        await sendButtons(phone, "💸 Withdrawal Menu", ["Withdraw Funds", "BACK"]);

        return;

      }

      if (command === "7") {

        await sendButtons(phone, "🔁 Recurring Payments", ["Manage Recurring", "My Recurring", "Cancel Recurring", "BACK"]);

        return;

      }

      if (command === "8") {

        state.state = "ai_chat";
        await state.save();

        await sendMessage(phone, "🤖 AlphaBot AI activated. Ask me anything.");

        return;

      }

      if (command === "9") {

        await sendButtons(phone, "🏆 Rewards", ["My Rewards", "Coming Soon", "BACK"]);

        return;

      }

      if (command === "10") {

        await sendButtons(phone, "🎮 Games", ["Play Games", "Leaderboard", "BACK"]);

        return;

      }

      if (command === "11") {

        await sendButtons(phone, "📞 AlphaBot Support", ["Contact Support", "BACK"]);

        return;

      }















      if (text === "support") {

        await sendMessage(
          phone,
          "☎️ AlphaBot Support\n\nFor assistance, contact AlphaBot support team."
        );

        return;

      }


      if (text === "history") {

        const Transaction = require("../models/Transaction");

        const transactions = await Transaction.find({ phone })
          .sort({ createdAt: -1 })
          .limit(5);

        if (!transactions.length) {

          await sendMessage(phone, "📜 No transactions found yet.");

          return;

        }

        let history = "📜 Recent Transactions:\n\n";

        transactions.forEach((tx)=>{
          history += `${tx.type} - ₦${tx.amount} - ${tx.status}\n`;
        });

        await sendMessage(phone, history);

        return;

        }








    const handledAI = await handleAI({
      phone,
      message,
      state,
      sendMessage
    });

    if (handledAI) return;

  await sendMessage(
    phone,








    "Invalid option. Send Hi to see the menu."
  );

};


module.exports = {
  handleMessage
};
