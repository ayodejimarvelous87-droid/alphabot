const { getAIReply } = require("../../services/aiService");
const AIUsage = require("../../models/AIUsage");
const SystemSetting = require("../../models/SystemSetting");

const handleAI = async ({
  phone,
  message,
  state,
  sendMessage
}) => {

  if (state.state === "ai_chat") {

    const text = message.toLowerCase().trim();

    const exitWords = [
      "menu",
      "back",
      "stop",
      "exit",
      "end",
      "cancel",
      "quit",
      "hi",
      "hello",
      "start"
    ];

    if (exitWords.includes(text)) {

      state.state = null;
      state.data = {};

      await state.save();

      await sendMessage(
        phone,
        "🤖 AI mode ended.\n\nWelcome back to AlphaBot menu. Send Hi to continue."
      );

      return true;
    }


    let usage = await AIUsage.findOne({ phone });


    if (!usage) {

      usage = await AIUsage.create({
        phone,
        count:0
      });

    }


    const now = new Date();
    const lastReset = new Date(usage.lastReset);


    if (
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {

      usage.count = 0;
      usage.lastReset = now;

    }


    const setting = await SystemSetting.findOne();

    const aiLimit = setting?.aiDailyLimit || 20;


    if (usage.count >= aiLimit) {

      await sendMessage(
        phone,
        `🚫 You have reached your daily AI limit of ${aiLimit} questions.\n\nTry again tomorrow.`
      );

      return true;

    }


    usage.count += 1;
    await usage.save();


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
