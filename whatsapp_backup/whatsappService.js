require("dotenv").config();

const twilio = require("twilio");


const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


const sendMessage = async (phone, message) => {

  try {

    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${phone}`,
      body: message
    });

    console.log("WhatsApp sent:", response.sid);

    return {
      success: true,
      data: response
    };


  } catch (error) {

    console.log(
      "WhatsApp send error:",
      error.message
    );

    return {
      success:false,
      message:error.message
    };

  }

};


const formatOptions = (items) => {

  return items
    .map((item,index)=> item === "BACK" ? "0. 🔙 Back" : `${index + 1}. ${item}`)
    .join("\n");

};


const sendButtons = async (phone, text, buttons) => {

  return await sendMessage(
    phone,
    text + "\n\n" + formatOptions(buttons)
  );

};


const sendMenu = async (phone, text, buttons) => {

  return await sendMessage(
    phone,
    text + "\n\nChoose an option:\n\n" + formatOptions(buttons)
  );

};


const sendList = async (phone, title, items) => {

  return await sendMessage(
    phone,
    title + "\n\n" + formatOptions(items)
  );

};


module.exports = {
  sendMessage,
  sendButtons,
  sendMenu,
  sendList
};
