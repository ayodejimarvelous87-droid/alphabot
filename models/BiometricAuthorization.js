const mongoose = require("mongoose");

const biometricAuthorizationSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    phone: {
      type: String,
      required: true,
      index: true
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "BiometricAuthorization",
  biometricAuthorizationSchema
);
