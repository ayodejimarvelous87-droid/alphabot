const { getAIReply } = require("../../services/aiService");

const handleAI = async ({
  phone,
  message,
  state,
  sendMessage
}) => {


  if (state.state === "ai_chat") {

    const reply = await getAIReply(message);

    await sendMessage(
      phone,
      reply
    );

    return true;
  }


  return false;

};


module.exports = {
  handleAI
};
