const axios = require("axios");


const handleElectricity = async ({
  phone,
  text,
  message,
  state,
  sendMessage,
  sendButtons
}) => {


  if (state.state === "awaiting_electricity_pin") {

    const response = await axios.post(
      "http://localhost:10000/electricity/pay",
      {
        phone,
        disco: state.data.disco,
        meterNumber: state.data.meterNumber,
        meterType: state.data.meterType,
        amount: state.data.amount,
        pin: message
      }
    );


    await sendMessage(
      phone,
      response.data.message || "⚡ Electricity payment created."
    );


    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  if (state.state === "awaiting_electricity_amount") {

    state.data.amount = Number(message);
    state.state = "awaiting_electricity_pin";

    await state.save();


    await sendMessage(
      phone,
      "🔐 Enter transaction PIN:"
    );

    return true;
  }


  if (state.state === "awaiting_meter_type") {

    state.data.meterType = text.includes("post")
      ? "postpaid"
      : "prepaid";

    state.state = "awaiting_electricity_amount";

    await state.save();


    await sendMessage(
      phone,
      "💰 Enter electricity amount:"
    );

    return true;
  }


  if (state.state === "awaiting_meter_number") {

    state.data.meterNumber = message;
    state.state = "awaiting_meter_type";

    await state.save();


    await sendButtons(
      phone,
      "Select meter type:",
      [
        "Prepaid",
        "Postpaid"
      ]
    );

    return true;
  }


    if (state.state === "awaiting_disco") {

      if (text === "back" || text === "0") {
        state.state = null;
        state.data = {};
        await state.save();

        await sendMessage(phone, "🔙 Returning to main menu.");
        return true;
      }

      const discoMap = {
        "1": "IKEDC",
        "2": "EKEDC",
        "3": "AEDC",
        "4": "PHED"
      };

      state.data.disco = discoMap[text] || message.toUpperCase();
      state.state = "awaiting_meter_number";

      await state.save();

      await sendMessage(phone, "⚡ Enter meter number:");
      return true;
    }


  if (text === "electricity" || text === "⚡ electricity") {

    state.state = "awaiting_disco";
    state.data = {};

    await state.save();


    await sendButtons(
      phone,
      "⚡ Select DISCO:",
      [
        "IKEDC",
        "EKEDC",
        "AEDC",
        "PHED"
      ]
    );

    return true;
  }


  return false;

};


module.exports = {
  handleElectricity
};
