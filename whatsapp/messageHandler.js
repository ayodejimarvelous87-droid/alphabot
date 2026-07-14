const { sendMessage } = require("./whatsappService");
const User = require("../models/User");
const Wallet = require("../models/wallet");
const UserState = require("../models/UserState");
const FundingRequest = require("../models/FundingRequest");


const handleMessage = async (phone, message) => {

  const text = message.toLowerCase().trim();

  let user = await User.findOne({ phone });


  if (!user) {

    const wallet = await Wallet.create({
      phone,
      balance: 0
    });


    user = await User.create({
      name: "AlphaBot User",
      phone,
      password: "whatsapp",
      wallet: wallet._id,
      referralCode: "AB" + Date.now()
    });

    console.log("New user created:", phone);
  }


  let state = await UserState.findOne({ phone });


  if (!state) {

    state = await UserState.create({
      phone,
      state: null,
      data: {}
    });

  }



  if (text === "hi" || text === "hello" || text === "start") {

    state.state = null;
    state.data = {};

    await state.save();


    await sendMessage(
      phone,
      `Welcome to AlphaBot 🚀

Choose an option:

1. Check Balance
2. Buy Data
3. Buy Airtime
4. Fund Wallet
5. Transaction History`
    );

    return;
  }



  if (text === "1") {

    const wallet = await Wallet.findOne({ phone });


    await sendMessage(
      phone,
      `Your wallet balance is ₦${wallet?.balance || 0}`
    );

    return;
  }



  if (text === "4") {

    state.state = "awaiting_amount";
    state.data = {};

    await state.save();


    await sendMessage(
      phone,
      "Enter the amount you want to fund:"
    );

    return;
  }



  if (state.state === "awaiting_amount") {

    state.data = {
      amount: Number(text)
    };

    state.markModified("data");

    state.state = "awaiting_reference";

    await state.save();


    await sendMessage(
      phone,
      "Enter your payment reference:"
    );

    return;
  }



  if (state.state === "awaiting_reference") {

    const amount = state.data.amount;


    const request = await FundingRequest.create({
      phone,
      amount,
      reference: text
    });


    await sendMessage(
      phone,
      `Funding request submitted ✅

Amount: ₦${request.amount}

Waiting for approval.`
    );


    state.state = null;
    state.data = {};

    await state.save();

    return;
  }



  await sendMessage(
    phone,
    "Invalid option. Send Hi to see the menu."
  );

};


module.exports = {
  handleMessage
};
