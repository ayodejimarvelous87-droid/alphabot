const axios = require("axios");

const handleExam = async ({
  phone,
  text,
  message,
  state,
  sendMessage,
  sendButtons
}) => {


  if (
    text === "waec" ||
    text === "neco" ||
    text === "result checker" ||
    text === "exam pin"
  ) {

    state.state = "awaiting_exam_type";
    state.data = {};

    await state.save();

    await sendButtons(phone, "🎓 Select Exam PIN", [
      "WAEC",
      "NECO",
      "JAMB",
      "NABTEB"
    ]);

    return true;
  }


  if (state.state === "awaiting_exam_quantity") {

    const quantity = Number(message);

    const response = await axios.post(
      "http://localhost:10000/whatsapp-exam/buy",
      {
        phone,
        exam: state.data.exam,
        quantity
      }
    );


    const pins = response.data.pins || [];


    await sendMessage(
      phone,
      `🎓 Exam PIN Purchase Successful ✅

Your PIN(s):

${pins.join("\n")}

💰 New Balance: ₦${response.data.balance}`
    );


    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  return false;

};


module.exports = {
  handleExam
};
