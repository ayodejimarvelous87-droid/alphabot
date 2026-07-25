const mongoose = require("mongoose");

const airtimeInventorySchema = new mongoose.Schema({

network:{
type:String,
required:true,
unique:true,
uppercase:true
},

storedAmount:{
type:Number,
default:0
},

limit:{
type:Number,
default:1500
}

},{
timestamps:true
});


module.exports = mongoose.model(
"AirtimeInventory",
airtimeInventorySchema
);
