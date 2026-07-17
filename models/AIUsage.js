const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true
    },

    count: {
      type: Number,
      default: 0
    },

    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AIUsage", aiUsageSchema);
