const express = require("express");
const router = express.Router();

const { processIncomingMessage } = require("./messageProcessor");
const twilio = require("twilio");


router.post("/", async (req, res) => {

  try {

    console.log(
      "Twilio WhatsApp webhook:",
      req.body
    );


    await processIncomingMessage(req.body);


    const response = new twilio.twiml.MessagingResponse();

    res.type("text/xml");

    res.send(response.toString());


  } catch (error) {

    console.log(
      "Twilio webhook error:",
      error.message
    );

    res.sendStatus(500);

  }

});


module.exports = router;
