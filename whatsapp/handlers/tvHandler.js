const axios = require("axios");


const handleTV = async ({
  phone,
  text,
  message,
  state,
  sendMessage,
  sendButtons
}) => {


  if (state.state === "awaiting_tv_pin") {

    const response = await axios.post(
      "http://localhost:10000/tv/subscribe",
      {
        phone,
        provider: state.data.provider,
        smartCardNumber: state.data.smartCardNumber,
        package: state.data.package,
        amount: state.data.amount,
        pin: message
      }
    );


    await sendMessage(
      phone,
      response.data.message || "📺 TV subscription created."
    );


    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  if (state.state === "awaiting_tv_amount") {

    state.data.amount = Number(message);
    state.state = "awaiting_tv_pin";

    await state.save();

    await sendMessage(
      phone,
      "🔐 Enter transaction PIN:"
    );

    return true;
  }


  if (state.state === "awaiting_tv_package") {

    state.data.package = message;

    state.state = "awaiting_tv_amount";

    await state.save();


    await sendMessage(
      phone,
      "💰 Enter subscription amount:"
    );

    return true;
  }


  if (state.state === "awaiting_tv_card") {

    state.data.smartCardNumber = message;

    state.state = "awaiting_tv_package";

    await state.save();


    await sendButtons(
      phone,
      "📦 Select package:",
      [
        "DSTV Compact",
        "DSTV Premium",
        "GOTV Max",
        "Startimes Basic"
      ]
    );

    return true;
  }


  if (state.state === "awaiting_tv_provider") {

    state.data.provider = message.toUpperCase();

    state.state = "awaiting_tv_card";

    await state.save();


    await sendMessage(
      phone,
      "📺 Enter smart card number:"
    );

    return true;
  }


  if (text === "tv" || text === "tv subscription" || text === "📺 tv subscription") {

    state.state = "awaiting_tv_provider";
    state.data = {};

    await state.save();


    await sendButtons(
      phone,
      "📺 Select TV provider:",
      [
        "DSTV",
        "GOTV",
        "STARTIMES"
      ]
    );

    return true;
  }


  return false;

};


module.exports = {
  handleTV
};
