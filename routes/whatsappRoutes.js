const express = require("express");
const router = express.Router();
const twilio = require("twilio");

const MessagingResponse = twilio.twiml.MessagingResponse;

router.post("/webhook", (req, res) => {
  const incomingMsg = req.body.Body || "";
  const from = req.body.From || "";

  console.log("WhatsApp message:", from, incomingMsg);

  const response = new MessagingResponse();

  if (incomingMsg.toLowerCase() === "hi" || incomingMsg.toLowerCase() === "hello") {
    response.message("Welcome to AlphaBot 🤖\n\nReply:\n1. Balance\n2. Buy Data");
  } else if (incomingMsg.toLowerCase() === "balance") {
    response.message("Your wallet balance will be checked soon.");
  } else {
    response.message("I don't understand that command yet. Send hi to start.");
  }

  res.type("text/xml");
  res.send(response.toString());
});

module.exports = router;
