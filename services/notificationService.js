const Notification = require("../models/Notification");

const createNotification = async (
  phone,
  title,
  message,
  type = "info",
  transactionId = null
) => {
  try {

    await Notification.create({
      phone,
      title,
      message,
      type,
      transactionId
    });

  } catch (error) {

    console.log(
      "Notification Error:",
      error.message
    );

  }
};

module.exports = {
  createNotification
};
