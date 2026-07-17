const axios = require("axios");
const Beneficiary = require("../../models/Beneficiary");

const handleAirtime = async ({
  phone,
  text,
  message,
  state,
  sendMessage,
  sendButtons
}) => {


    if (text === "airtime" || text === "air") {

      state.state = "awaiting_airtime_option";
      state.data = {};

      await state.save();

      await sendButtons(phone, "📱 Airtime Purchase", [
        "New Number",
        "Saved Beneficiary"
      ]);

      return true;
    }


  if (state.state === "awaiting_airtime_network") {

    if (state.state === "awaiting_airtime_option") {

      if (text === "saved beneficiary") {

        const list = await Beneficiary.find({
          phone,
          service:"airtime"
        });

        if (!list.length) {
          await sendMessage(phone, "No airtime beneficiaries saved.");
          return true;
        }

        let reply = "👥 Select beneficiary:\n\n";

        list.forEach((item,index)=>{
          reply += `${index + 1}. ${item.nickname} - ${item.targetPhone}\n`;
        });

        state.data.airtimeBeneficiaries = list.map(x=>x.targetPhone);
        state.state = "awaiting_airtime_beneficiary";

        await state.save();
        await sendMessage(phone, reply);
        return true;
      }

      if (text === "new number") {
        state.state = "awaiting_airtime_network";
        await state.save();

        await sendButtons(phone, "📱 Select Airtime Network", [
          "MTN",
          "Airtel",
          "Glo",
          "9mobile"
        ]);

        return true;
      }

      await sendMessage(phone, "Choose New Number or Saved Beneficiary.");
      return true;
    }

    if (state.state === "awaiting_airtime_beneficiary") {

      const index = Number(text) - 1;
      const numbers = state.data.airtimeBeneficiaries || [];

      if (!numbers[index]) {
        await sendMessage(phone, "❌ Invalid beneficiary selection.");
        return true;
      }

      state.data.targetPhone = numbers[index];
      state.state = "awaiting_airtime_amount";

      await state.save();

      await sendMessage(
        phone,
        "💰 Enter airtime amount:"
      );

      return true;
    }


    state.data.network = message.toUpperCase();
    state.state = "awaiting_airtime_phone";

    await state.save();

    await sendMessage(
      phone,
      "📱 Enter the phone number to receive airtime:"
    );

    return true;
  }


  if (state.state === "awaiting_airtime_phone") {

    state.data.targetPhone = message;
    state.state = "awaiting_airtime_amount";

    await state.save();

    await sendMessage(
      phone,
      "💰 Enter airtime amount:"
    );

    return true;
  }


  if (state.state === "awaiting_airtime_amount") {

    state.data.amount = Number(message);
    state.state = "awaiting_airtime_pin";

    await state.save();

    await sendMessage(
      phone,
      "🔐 Enter your transaction PIN:"
    );

    return true;
  }


  if (state.state === "awaiting_airtime_pin") {

    try {

      const response = await axios.post(
        "http://localhost:10000/airtime",
        {
          phone: state.data.targetPhone || phone,
          network: state.data.network,
          amount: state.data.amount,
          pin: message
        }
      );

      await sendMessage(
        phone,
        response.data.message || "📱 Airtime purchase successful."
      );

    } catch(error) {

      await sendMessage(
        phone,
        error.response?.data?.message || "❌ Airtime purchase failed."
      );

    }

    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  // Quick command:
  // buy airtime 500 mtn

  if (text.startsWith("buy airtime")) {

    const parts = text.split(" ");

    const amount = Number(parts[2]);
    const network = parts[3];

    if (!amount || !network) {

      await sendMessage(
        phone,
        "Format: buy airtime 500 mtn"
      );

      return true;
    }


    state.state = "awaiting_airtime_pin";

    state.data = {
      network: network.toUpperCase(),
      amount
    };


    await state.save();


    await sendMessage(
      phone,
      `📱 ${network.toUpperCase()} Airtime\n💰 ₦${amount}\n\nEnter transaction PIN:`
    );


    return true;
  }


  return false;

};


module.exports = {
  handleAirtime
};
