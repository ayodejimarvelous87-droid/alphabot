const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },

    phone: {
      type: String,
      default: null
    },

    userType: {
      type: String,
      enum: ["admin", "user"],
      default: "user"
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
