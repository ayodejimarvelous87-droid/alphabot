const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000
});

const sendEmail = async(to, subject, text)=>{

  try{

  console.log("SMTP_LOGIN:", process.env.SMTP_LOGIN);
  console.log("SMTP_FROM:", process.env.SMTP_FROM);
  console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "EXISTS" : "MISSING");

    await transporter.verify();

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text
    });

    console.log("Email sent successfully to:", to);

  }catch(error){

    console.log("EMAIL ERROR:", error.message);
    throw error;

  }

};

module.exports = sendEmail;
