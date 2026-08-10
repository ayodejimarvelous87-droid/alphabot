const mongoose = require("mongoose");

const webAuthnChallengeSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["registration", "authentication", "login"],
      required: true
    },

    challenge: {
      type: String,
      required: true
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
  "WebAuthnChallenge",
  webAuthnChallengeSchema
);
