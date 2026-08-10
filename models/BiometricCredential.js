const mongoose = require("mongoose");

const biometricCredentialSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true
    },

    credentialID: {
      type: String,
      required: true,
      unique: true
    },

    publicKey: {
      type: Buffer,
      required: true
    },

    counter: {
      type: Number,
      default: 0
    },

    transports: {
      type: [String],
      default: []
    },

    deviceName: {
      type: String,
      default: "This device"
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    lastUsedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "BiometricCredential",
  biometricCredentialSchema
);
