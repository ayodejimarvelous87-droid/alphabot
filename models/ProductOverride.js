const mongoose = require("mongoose");

const productOverrideSchema = new mongoose.Schema(
{
  productId:{
    type:String,
    required:true,
    unique:true
  },

  provider:{
    type:String,
    default:""
  },

  providerPlanId:{
    type:String,
    default:""
  },

  network:{
    type:String,
    default:""
  },

  name:{
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

  active:{
    type:Boolean,
    default:true
  }

},
{
 timestamps:true
}
);

module.exports = mongoose.model(
"ProductOverride",
productOverrideSchema
);
