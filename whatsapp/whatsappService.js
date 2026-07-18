require("dotenv").config();

const axios = require("axios");


const META_URL =
`https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`;


const sendMessage = async (phone, message) => {

  try {

    const response = await axios.post(
      META_URL,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );


    console.log(
      "WhatsApp sent:",
      response.data.messages?.[0]?.id
    );


    return {
      success:true,
      data:response.data
    };


  } catch(error){

    console.log(
      "WhatsApp send error:",
      error.response?.data || error.message
    );


    return {
      success:false,
      message:error.message
    };

  }

};



const formatOptions = (items)=>{

  return items
    .map(
      (item,index)=>
        item === "BACK"
        ? "0. 🔙 Back"
        : `${index + 1}. ${item}`
    )
    .join("\n");

};



const sendButtons = async(phone,text,buttons)=>{

  return await sendMessage(
    phone,
    text + "\n\n" + formatOptions(buttons)
  );

};



const sendMenu = async(phone,text,buttons)=>{

  return await sendMessage(
    phone,
    text + "\n\nChoose an option:\n\n" + formatOptions(buttons)
  );

};



const sendList = async(phone,title,items)=>{

  return await sendMessage(
    phone,
    title + "\n\n" + formatOptions(items)
  );

};



module.exports = {
  sendMessage,
  sendButtons,
  sendMenu,
  sendList
};
