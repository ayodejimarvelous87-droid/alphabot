const mongoose = require("mongoose");

const profitSchema = new mongoose.Schema({

service:{
 type:String,
 required:true
},

amount:{
 type:Number,
 required:true
},

reference:{
 type:String
},

phone:{
 type:String
}

},{
timestamps:true
});


module.exports = mongoose.model(
"Profit",
profitSchema
);
