const axios = require("axios");

const sendEmail = async (to, subject, text) => {
  try {

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: process.env.SMTP_FROM
        },
        to: [
          {
            email: to
          }
        ],
        subject,
        textContent: text
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Email sent successfully to:", to);

    return response.data;

  } catch (error) {

    console.log(
      "EMAIL ERROR:",
      error.response?.data || error.message
    );

    throw error;
  }
};

module.exports = sendEmail;
