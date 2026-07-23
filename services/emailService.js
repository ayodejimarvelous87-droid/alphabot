const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text
  });

  console.log("Email sent successfully to:", to);
};

module.exports = sendEmail;
