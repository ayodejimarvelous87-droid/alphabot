const mongoose = require("mongoose");

const fundingRequestSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    reference: {
      type: String,
      default: null,
      trim: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("FundingRequest", fundingRequestSchema);
