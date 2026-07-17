const AirtimeCash = require("../../models/AirtimeCash");

const handleAirtimeCash = async ({
  phone,
  text,
  state,
  sendMessage
}) => {


  if (text === "airtime cash" || text === "airtimecash") {

    state.state = "awaiting_airtime_cash_network";
    state.data = {};

    await state.save();

    await sendMessage(
      phone,
      "💵 Enter airtime network:\n\nMTN\nAirtel\nGlo\n9mobile"
    );

    return true;
  }


  if (state.state === "awaiting_airtime_cash_network") {

    state.data.network = text;

    state.state = "awaiting_airtime_cash_amount";

    await state.save();

    await sendMessage(
      phone,
      "Enter airtime amount:"
    );

    return true;
  }


  if (state.state === "awaiting_airtime_cash_amount") {

    const amount = Number(text);

    if (isNaN(amount) || amount <= 0) {

      await sendMessage(
        phone,
        "Enter a valid amount."
      );

      return true;
    }


    const cashAmount = amount * 0.8;


    const request = await AirtimeCash.create({
      phone,
      network: state.data.network,
      amount,
      cashAmount,
      reference: "AC" + Date.now(),
      status: "pending"
    });


    await sendMessage(
      phone,
      `✅ Airtime Cash request submitted.

Network: ${request.network}
Airtime: ₦${request.amount}
You will receive: ₦${request.cashAmount}

Status: Pending`
    );


    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  return false;

};


module.exports = {
  handleAirtimeCash
};
