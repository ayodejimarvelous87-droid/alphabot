const Recurring = require("../../models/Recurring");

const handleRecurring = async ({
  phone,
  text,
  message,
  state,
  sendMessage,
  sendButtons
}) => {


  if (text === "recurring" || text === "schedule" || text.includes("recurring payments")) {

    state.state = "awaiting_recurring_service";
    state.data = {};

    await state.save();

    await sendButtons(phone, "🔁 Select Recurring Service", [
      "DATA",
      "AIRTIME"
    ]);

    return true;
  }


  if (state.state === "awaiting_recurring_service") {

    const service = message.toLowerCase();

    if (service !== "data" && service !== "airtime") {

      await sendMessage(phone, "Please select DATA or AIRTIME.");

      return true;
    }

    state.data.service = service;
    state.state = "awaiting_recurring_amount";

    await state.save();

    await sendMessage(
      phone,
      "💰 Enter the amount for recurring payment:"
    );

    return true;
  }


  if (state.state === "awaiting_recurring_amount") {

    state.data.amount = Number(message);
    state.state = "awaiting_recurring_frequency";

    await state.save();

    await sendButtons(phone, "⏰ Select Payment Frequency", [
      "DAILY",
      "WEEKLY",
      "MONTHLY"
    ]);

    return true;
  }


  if (state.state === "awaiting_recurring_frequency") {

    const frequency = message.toLowerCase();

    if (!["daily", "weekly", "monthly"].includes(frequency)) {

      await sendMessage(
        phone,
        "Please select DAILY, WEEKLY or MONTHLY."
      );

      return true;
    }

    const nextRun = new Date();

    if (frequency === "daily") nextRun.setDate(nextRun.getDate() + 1);
    if (frequency === "weekly") nextRun.setDate(nextRun.getDate() + 7);
    if (frequency === "monthly") nextRun.setMonth(nextRun.getMonth() + 1);


    await Recurring.create({
      phone,
      service: state.data.service,
      amount: state.data.amount,
      frequency,
      nextRun
    });


    await sendMessage(
      phone,
      "✅ Recurring payment activated successfully."
    );


    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  if (text === "my recurring" || text === "recurring list") {

    const payments = await Recurring.find({
      phone,
      status: "active"
    });


    if (!payments.length) {

      await sendMessage(
        phone,
        "You have no active recurring payments."
      );

      return true;
    }


    let reply = "🔁 Your Active Recurring Payments:\n\n";

    payments.forEach((item,index)=>{

      reply += `${index + 1}. ${item.service.toUpperCase()}\n`;
      reply += `Amount: ₦${item.amount}\n`;
      reply += `Frequency: ${item.frequency}\n`;
      reply += `Next run: ${item.nextRun.toDateString()}\n\n`;

    });


    await sendMessage(phone, reply);

    return true;
  }


  if (text === "cancel recurring") {

    const payments = await Recurring.find({
      phone,
      status: "active"
    });


    if (!payments.length) {

      await sendMessage(
        phone,
        "You have no active recurring payments."
      );

      return true;
    }


    state.state = "awaiting_cancel_recurring";
    state.data.recurringIds = payments.map(p => p._id);

    await state.save();


    let reply = "❌ Select recurring payment to cancel:\n\n";

    payments.forEach((item,index)=>{

      reply += `${index + 1}. ${item.service.toUpperCase()} ₦${item.amount} (${item.frequency})\n`;

    });


    await sendMessage(phone, reply);

    return true;
  }


  if (state.state === "awaiting_cancel_recurring") {

    const choice = Number(message) - 1;
    const id = state.data.recurringIds[choice];


    if (!id) {

      await sendMessage(phone, "Invalid selection.");

      return true;
    }


    await Recurring.findByIdAndUpdate(
      id,
      { status:"cancelled" }
    );


    await sendMessage(
      phone,
      "✅ Recurring payment cancelled successfully."
    );


    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  return false;

};


module.exports = {
  handleRecurring
};
