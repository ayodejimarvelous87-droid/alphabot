const mongoose = require("mongoose");

const abCoinTransactionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        "purchase_reward",
        "redemption",
        "admin_adjustment"
      ],
      required: true
    },

    coins: {
      type: Number,
      required: true
    },

    balanceBefore: {
      type: Number,
      default: 0
    },

    balanceAfter: {
      type: Number,
      default: 0
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
      unique: true,
      sparse: true
    },

    purchaseAmount: {
      type: Number,
      default: null
    },

    description: {
      type: String,
      required: true
    },

    reference: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

abCoinTransactionSchema.index({
  phone: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  "ABCoinTransaction",
  abCoinTransactionSchema
);
