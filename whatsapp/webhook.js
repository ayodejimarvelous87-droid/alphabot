const express = require("express");
const router = express.Router();

const { processIncomingMessage } = require("./messageProcessor");


// Meta webhook verification
router.get("/", (req, res) => {

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];


  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {

    console.log("Meta webhook verified");

    return res.status(200).send(challenge);

  }


  res.sendStatus(403);

});



// Receive WhatsApp messages
router.post("/", async (req, res) => {

  try {

    console.log(
      "Meta WhatsApp webhook:",
      JSON.stringify(req.body, null, 2)
    );


    await processIncomingMessage(req.body);


    res.sendStatus(200);


  } catch(error){

    console.log(
      "Meta webhook error:",
      error.message
    );


    res.sendStatus(500);

  }

});


module.exports = router;
