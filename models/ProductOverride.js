const mongoose = require("mongoose");

const productOverrideSchema = new mongoose.Schema(
{
  // AlphaBot's stable product identity.
  // This is NOT the provider's plan ID.
  productId:{
    type:String,
    required:true,
    unique:true,
    index:true
  },

  // Provider information used only for routing purchases.
  provider:{
    type:String,
    default:"",
    index:true
  },

  providerPlanId:{
    type:String,
    default:""
  },

  network:{
    type:String,
    default:"",
    index:true
  },

  category:{
    type:String,
    default:""
  },

  name:{
    type:String,
    default:""
  },

  datasize:{
    type:String,
    default:""
  },

  validity:{
    type:String,
    default:""
  },

  providerPrice:{
    type:Number,
    default:0
  },

  sellingPrice:{
    type:Number,
    default:0
  },

  // Admin controls.
  active:{
    type:Boolean,
    default:true,
    index:true
  }

},
{
  timestamps:true
});

module.exports = mongoose.model(
  "ProductOverride",
  productOverrideSchema
);
