const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["fund", "purchase"],
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "successful"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);