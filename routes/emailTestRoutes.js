const express = require("express");
const router = express.Router();

const sendEmail = require("../services/emailService");

router.get("/", async (req, res) => {
  try {
    await sendEmail(
      "ayodejimarvelous679@gmail.com",
      "AlphaBot Test",
      "Brevo SMTP is working successfully 🚀"
    );

    res.json({
      message: "Email sent successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
