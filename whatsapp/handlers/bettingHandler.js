const axios = require("axios");


const handleBetting = async ({
  phone,
  text,
  message,
  state,
  sendMessage,
  sendButtons
}) => {


  if (state.state === "awaiting_betting_pin") {

    const response = await axios.post(
      "http://localhost:10000/betting/fund",
      {
        phone,
        provider: state.data.provider,
        customerId: state.data.customerId,
        amount: state.data.amount,
        pin: message
      }
    );


    await sendMessage(
      phone,
      response.data.message || "🎮 Betting funding created."
    );


    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  if (state.state === "awaiting_betting_amount") {

    state.data.amount = Number(message);
    state.state = "awaiting_betting_pin";

    await state.save();


    await sendMessage(
      phone,
      "🔐 Enter transaction PIN:"
    );

    return true;
  }


  if (state.state === "awaiting_customer_id") {

    state.data.customerId = message;

    state.state = "awaiting_betting_amount";

    await state.save();


    await sendMessage(
      phone,
      "💰 Enter betting amount:"
    );

    return true;
  }


  if (state.state === "awaiting_betting_provider") {

    state.data.provider = message.toUpperCase();

    state.state = "awaiting_customer_id";

    await state.save();


    await sendMessage(
      phone,
      "🎮 Enter betting customer ID:"
    );

    return true;
  }


  if (
    text === "betting" ||
    text === "🎮 betting"
  ) {

    state.state = "awaiting_betting_provider";
    state.data = {};

    await state.save();


    await sendButtons(
      phone,
      "🎮 Select betting provider:",
      [
        "BET9JA",
        "SPORTYBET",
        "1XBET"
      ]
    );


    return true;
  }


  return false;

};


module.exports = {
  handleBetting
};
