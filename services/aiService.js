require("dotenv").config();

const Groq = require("groq-sdk");


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


const getAIReply = async (message) => {

  try {

    const response = await groq.chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
          content:
          "You are AlphaBot AI Assistant. You help users with general questions and AlphaBot services including wallet, VTU, airtime, data, referrals, rewards and support. Be friendly, concise and helpful."
        },
        {
          role: "user",
          content: message
        }
      ],

      temperature: 0.7,
      max_tokens: 500

    });


    return response.choices[0].message.content;


  } catch(error){

    console.log(
      "AI Error:",
      error.message
    );


    return "Sorry, AlphaBot AI is temporarily unavailable. Please try again later.";

  }

};


module.exports = {
  getAIReply
};
