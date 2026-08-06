const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const { sendPushNotification } = require("./firebaseService");


const createNotification = async (
  phone,
  title,
  message,
  type = "info",
  transactionId = null,
  blogPartner = null
) => {

  try {

    // Save notification in database
    await Notification.create({
      phone,
      title,
      message,
      type,
      transactionId,
      blogPartner
    });


    // Find user's Firebase device
    let device;

    if(phone === "admin"){

      device = await DeviceToken.findOne({
        userType:"admin"
      });

    }else{

      device = await DeviceToken.findOne({
        phone
      });

    }


    // Send Firebase push notification (best effort)
    try{

      if(device?.token){

        await sendPushNotification(
          device.token,
          title,
          message
        );

      }

    }catch(pushError){

      console.log(
        "Push notification failed:",
        pushError.message
      );

    }


    return true;


  } catch(error){

    console.log(
      "Notification Error:",
      error.message
    );

    throw error;

  }

};


module.exports = {
  createNotification
};
