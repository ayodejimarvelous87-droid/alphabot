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
      success: false,
      message: error.message
    };

  }

};


module.exports = {
  sendMessage
};
