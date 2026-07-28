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
      enum: [
        "data",
        "airtime",
        "tv",
        "electricity",
        "betting",
        "exam-pin",
        "epin",
        "airtime-cash",
        "bank"
      ],
      required: true
    },

    providerPrice: {
      type: Number,
      default: 0
    },

    price: {
      type: Number,
      required: true
    },

    providerPrice: {
      type: Number,
      default: 0
    },

    validity: {
      type: String,
      default: "30 Days"
    },

    providerCode: {
      type: String,
      default: ""
    },

    variation_id: {
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
