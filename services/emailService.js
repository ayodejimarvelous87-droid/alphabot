const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
host:"smtp.gmail.com",
port:587,
secure:false,
requireTLS:true,
auth:{
user:process.env.EMAIL_USER,
pass:process.env.EMAIL_PASS
},
connectionTimeout:10000,
socketTimeout:10000
});

const sendEmail = async(to, subject, text)=>{

try{

await transporter.sendMail({
from:process.env.EMAIL_USER,
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
