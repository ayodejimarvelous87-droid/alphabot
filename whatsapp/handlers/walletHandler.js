const Wallet = require("../../models/wallet");
const FundingRequest = require("../../models/FundingRequest");

const handleWallet = async ({
  phone,
  text,
  state,
  sendMessage
}) => {


  if (text === "bal" || text === "balance") {

    const wallet = await Wallet.findOne({ phone });

    await sendMessage(
      phone,
      `💰 Wallet Balance: ₦${wallet?.balance || 0}`
    );

    return true;
  }


  if (text === "4") {

    state.state = "awaiting_amount";
    state.data = {};

    await state.save();

    await sendMessage(
      phone,
      "Enter the amount you want to fund:"
    );

    return true;
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
      "Send your payment reference:"
    );

    return true;
  }


  if (state.state === "awaiting_reference") {

    const request = await FundingRequest.create({
      phone,
      amount: state.data.amount,
      reference: text
    });


    await sendMessage(
      phone,
      `Funding request submitted ✅\n\nAmount: ₦${request.amount}\nWaiting for approval.`
    );


    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  return false;

};


module.exports = {
  handleWallet
};
