const mongoose = require("mongoose");

const providerRouteSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true
    },

    providerPlanId: {
      type: String,
      required: true
    },

    costPrice: {
      type: Number,
      default: 0
    },

    sellingPrice: {
      type: Number,
      default: 0
    },

    active: {
      type: Boolean,
      default: true
    },

    priority: {
      type: Number,
      default: 100
    },

    lastSeenAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const dataProductSchema = new mongoose.Schema(
  {
    productKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    network: {
      type: String,
      required: true,
      index: true
    },

    category: {
      type: String,
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    datasize: {
      type: String,
      default: ""
    },

    validity: {
      type: String,
      default: ""
    },

    active: {
      type: Boolean,
      default: true
    },

    providers: {
      type: [providerRouteSchema],
      default: []
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    lastSeenAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

dataProductSchema.index({
  network: 1,
  category: 1,
  active: 1
});

module.exports = mongoose.model(
  "DataProduct",
  dataProductSchema
);
