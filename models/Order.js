const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    productName: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);