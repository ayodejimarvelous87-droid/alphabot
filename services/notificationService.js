const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const { sendPushNotification } = require("./firebaseService");


const createNotification = async (
  phone,
  title,
  message,
  type = "info",
  transactionId = null
) => {

  try {

    // Save notification in database
    await Notification.create({
      phone,
      title,
      message,
      type,
      transactionId
    });


    // Find user's Firebase device
    const device = await DeviceToken.findOne({
      phone
    });


    // Send Firebase push notification
    if(device?.token){

      await sendPushNotification(
        device.token,
        title,
        message
      );

    }


  } catch(error){

    console.log(
      "Notification Error:",
      error.message
    );

  }

};


module.exports = {
  createNotification
};
