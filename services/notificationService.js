const Notification = require("../models/Notification");

const createNotification = async (
  phone,
  title,
  message,
  type = "info"
) => {
  try {

    await Notification.create({
      phone,
      title,
      message,
      type
    });

  } catch (error) {

    console.log("Notification Error:", error.message);

  }
};

module.exports = {
  createNotification
};
