const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


const sendSMS = async(phone,message)=>{

try{

await client.messages.create({

body: message,

from: process.env.TWILIO_PHONE_NUMBER,

to: phone

});


return true;


}catch(error){

console.log("SMS Error:",error.message);

return false;

}

};


module.exports = sendSMS;
