const Beneficiary = require("../../models/Beneficiary");

const handleBeneficiary = async ({
  phone,
  text,
  state,
  sendMessage
}) => {


  if (text === "beneficiary" || text === "beneficiaries" || text === "add beneficiary") {

    state.state = "awaiting_beneficiary_service";
    state.data = {};

    await state.save();


    await sendMessage(
      phone,
      "👥 Select beneficiary service:\n\nDATA\nAIRTIME"
    );


    return true;
  }



  if (state.state === "awaiting_beneficiary_service") {


    const service = text.toLowerCase();


    const allowed = [
      "data",
      "airtime"
    ];


    if (!allowed.includes(service)) {


      await sendMessage(
        phone,
        "Choose only DATA or AIRTIME."
      );


      return true;
    }


    state.data.service = service;
    state.state = "awaiting_beneficiary_phone";


    await state.save();


    await sendMessage(
      phone,
      "📱 Enter beneficiary phone number:"
    );


    return true;
  }




  if (state.state === "awaiting_beneficiary_phone") {


    state.data.targetPhone = text;


    state.state = "awaiting_beneficiary_nickname";


    await state.save();


    await sendMessage(
      phone,
      "Enter beneficiary nickname:"
    );


    return true;
  }





  if (state.state === "awaiting_beneficiary_nickname") {


    const beneficiary = await Beneficiary.create({

      phone,

      owner: phone,

      service: state.data.service,

      targetPhone: state.data.targetPhone,

      nickname: text

    });



    await sendMessage(
      phone,
      `✅ Beneficiary saved.\n\nName: ${beneficiary.nickname}\nService: ${beneficiary.service}\nNumber: ${beneficiary.targetPhone}`
    );



    state.state = null;
    state.data = {};

    await state.save();


    return true;
  }




  if (text === "my beneficiaries") {


    const list = await Beneficiary.find({ phone });



    if (!list.length) {


      await sendMessage(
        phone,
        "No beneficiaries saved yet."
      );


      return true;

    }



    let reply = "👥 Your Beneficiaries:\n\n";



    list.forEach((item,index)=>{

      reply += `${index + 1}. ${item.nickname} - ${item.service} - ${item.targetPhone}\n`;

    });



    await sendMessage(phone, reply);


    return true;
  }



  return false;

};



module.exports = {
  handleBeneficiary
};
