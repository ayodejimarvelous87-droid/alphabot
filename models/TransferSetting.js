const mongoose = require("mongoose");

const transferSettingSchema = new mongoose.Schema({

transferFee:{
type:Number,
default:10
},

feeEnabled:{
type:Boolean,
default:true
},

promoActive:{
type:Boolean,
default:false
},

promoMessage:{
type:String,
default:""
}

},{
timestamps:true
});


module.exports = mongoose.model(
"TransferSetting",
transferSettingSchema
);
