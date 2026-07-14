const { handleMessage } = require("./messageHandler");


const processIncomingMessage = async (body) => {

  try {

    let phone;
    let text;


    // Twilio WhatsApp format
    if (body.Body && body.From) {

      phone = body.From.replace("whatsapp:", "");
      text = body.Body;

    }


    // Meta WhatsApp Cloud API format
    else {

      const entry = body.entry?.[0];

      if (!entry) return;


      const change = entry.changes?.[0];

      if (!change) return;


      const value = change.value;

      const message = value.messages?.[0];

      if (!message) return;


      phone = message.from;
      text = message.text?.body;

    }


    if (!text) return;


    console.log("Customer:", phone);
    console.log("Message:", text);


    await handleMessage(phone, text);


  } catch (error) {

    console.log(
      "Message processor error:",
      error.message
    );

  }

};


module.exports = {
  processIncomingMessage
};
