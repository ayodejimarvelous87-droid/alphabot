const axios = require("axios");
const Beneficiary = require("../../models/Beneficiary");
const Product = require("../../models/Product");

const handleData = async ({
  phone,
  text,
  message,
  state,
  sendMessage
}) => {


  if (state.state === "awaiting_data_pin") {

    const response = await axios.post(
      "http://localhost:10000/vtu/buy-data",
      {
        phone,
        network: state.data.network,
        plan: state.data.plan,
        amount: state.data.amount,
        pin: message
      }
    );

    await sendMessage(
      phone,
      response.data.message || "🌐 Data purchase completed."
    );

    state.state = null;
    state.data = {};
    await state.save();

    return true;

  }


  if (state.state === "awaiting_data_amount") {

    state.data.amount = Number(message);
    state.state = "awaiting_data_pin";

    await state.save();

    await sendMessage(phone, "🔐 Enter your transaction PIN:");

    return true;
  }


    if (state.state === "awaiting_data_option") {

      if (text === "saved beneficiary") {

        const list = await Beneficiary.find({
          phone,
          service:"data"
        });

        if (!list.length) {
          await sendMessage(phone, "No data beneficiaries saved.");
          return true;
        }

        let reply = "👥 Select beneficiary:\n\n";

        list.forEach((item,index)=>{
          reply += `${index + 1}. ${item.nickname} - ${item.targetPhone}\n`;
        });


    if (state.state === "awaiting_data_beneficiary") {

      const index = Number(text) - 1;
      const numbers = state.data.dataBeneficiaries || [];

      if (!numbers[index]) {
        await sendMessage(phone, "❌ Invalid beneficiary selection.");
        return true;
      }

      state.data.targetPhone = numbers[index];
      state.data.phone = numbers[index];
      state.state = "awaiting_data_amount";

      await state.save();

      await sendMessage(phone, "💰 Enter the data amount:");
      return true;
    }

        state.data.dataBeneficiaries = list.map(x=>x.targetPhone);
        state.state = "awaiting_data_beneficiary";

        await state.save();
        await sendMessage(phone, reply);
        return true;
      }

      if (text === "new number") {

        state.state = "awaiting_data_phone";
        await state.save();

        await sendMessage(phone, "📱 Enter the phone number to buy data for:");
        return true;
      }

      await sendMessage(phone, "Choose New Number or Saved Beneficiary.");
      return true;
    }

  if (state.state === "awaiting_data_phone") {

    state.data.phone = message;
    state.state = "awaiting_data_amount";

    await state.save();

    await sendMessage(phone, "💰 Enter the data amount:");

    return true;
  }

    if (state.state === "awaiting_data_plan") {

      const planMap = {
        "1": "1GB",
        "2": "2GB",
        "3": "5GB",
        "4": "10GB"
      };

      state.data.plan = planMap[text] || message;
      state.state = "awaiting_data_option";

      await state.save();

      await sendButtons(phone, "📱 Choose purchase option:", [
        "New Number",
        "Saved Beneficiary"
      ]);

      return true;
    }

  if (state.state === "awaiting_data_network") {

    state.data.network = message;
    state.state = "awaiting_data_plan";

    await state.save();

    await sendButtons(phone, "📦 Select Data Plan", [
      "1GB",
      "2GB",
      "5GB",
      "10GB"
    ]);

    return true;
  }

  if (!text.startsWith("buy data")) {
    return false;
  }

  const parts = text.split(" ");

  const plan = parts[2];
  const network = parts[3];

  if (!plan || !network) {
    await sendMessage(
      phone,
      "Format: buy data 1gb mtn"
    );

    return true;
  }

  const product = await Product.findOne({
    type: "data",
    network: network.toLowerCase(),
    name: new RegExp(plan, "i"),
    status: "active"
  });


  if (!product) {

    await sendMessage(
      phone,
      "❌ Data plan not found."
    );

    return true;
  }


  state.state = "awaiting_data_pin";

  state.data = {
    network: product.network,
    plan: product.name,
    amount: product.price,
    productId: product._id
  };


  await state.save();


  await sendMessage(
    phone,
    `🌐 ${product.network.toUpperCase()} ${product.name}\n💰 Price: ₦${product.price}\n\nEnter transaction PIN:`
  );


  return true;

};


module.exports = {
  handleData
};
