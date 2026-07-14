const mongoose = require("mongoose");

const userStateSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },

  state: {
    type: String,
    default: null
  },

  data: {
    type: Object,
    default: {}
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("UserState", userStateSchema);
