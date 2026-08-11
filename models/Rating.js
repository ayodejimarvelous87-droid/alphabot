const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    phone: {
      type: String,
      required: true,
      index: true
    },

    email: {
      type: String,
      default: ""
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    feedback: {
      type: String,
      default: "",
      maxlength: 1000
    },

    displayPublicly: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Rating", RatingSchema);
