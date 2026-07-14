const mongoose = require("mongoose");

const bankSettingsSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true
    },

    accountNumber: {
      type: String,
      required: true
    },

    accountName: {
      type: String,
      required: true
    },

    instructions: {
      type: String,
      default: "Transfer money and submit your payment reference."
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("BankSettings", bankSettingsSchema);
