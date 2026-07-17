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


const sendButtons = async (phone, text, buttons) => {

  console.log("Buttons:", buttons);

  return await sendMessage(
    phone,
    text + "\n\n" + buttons.map((b,i)=>`${i+1}. ${b}`).join("\n")
  );

};


const sendList = async (phone, title, items) => {

  console.log("List:", items);

  return await sendMessage(
    phone,
    title + "\n\n" + items.map((item,i)=>`${i+1}. ${item}`).join("\n")
  );

};


module.exports = {
  sendMessage,
  sendButtons,
  sendList
};
