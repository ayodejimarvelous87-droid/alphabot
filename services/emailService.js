const nodemailer = require("nodemailer");

const sendEmail = async(to, subject, text)=>{

const transporter = nodemailer.createTransport({
service:"gmail",
auth:{
user:process.env.EMAIL_USER,
pass:process.env.EMAIL_PASS
},
connectionTimeout:10000,
socketTimeout:10000
});


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
