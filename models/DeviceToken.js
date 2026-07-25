const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },

    userType: {
      type: String,
      default: "admin"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "DeviceToken",
  deviceTokenSchema
);
