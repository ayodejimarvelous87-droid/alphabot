const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    network: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["data", "airtime", "cable", "electricity", "mifi"],
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    validity: {
      type: String,
      default: "30 Days"
    },

    providerCode: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);