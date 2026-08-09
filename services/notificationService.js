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


    // Find all Firebase devices belonging to the recipient.
    const devices =
      phone === "admin"
        ? await DeviceToken.find({
            userType:"admin"
          }).lean()
        : await DeviceToken.find({
            phone
          }).lean();

    // Send Firebase push notifications to every registered device.
    await Promise.all(
      devices.map(async(device)=>{
        if(!device?.token) return;

        try{

          await sendPushNotification(
            device.token,
            title,
            message
          );

        }catch(pushError){

          console.log(
            "Push notification failed:",
            pushError.message
          );

        }
      })
    );


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
