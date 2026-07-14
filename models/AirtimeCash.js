const mongoose = require("mongoose");

const airtimeCashSchema = new mongoose.Schema({

phone:{
type:String,
required:true
},

network:{
type:String,
required:true
},

amount:{
type:Number,
required:true
},

cashAmount:{
type:Number,
required:true
},

status:{
type:String,
enum:[
"pending",
"approved",
"rejected"
],
default:"pending"
},

reference:{
type:String,
unique:true
}

},
{
timestamps:true
});


module.exports = mongoose.model(
"AirtimeCash",
airtimeCashSchema
);
