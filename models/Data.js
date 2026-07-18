const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({

phone:{
type:String,
required:true
},

network:{
type:String,
required:true
},

plan:{
type:String,
required:true
},

amount:{
type:Number,
required:true
},

reference:{
type:String,
unique:true
},

status:{
type:String,
enum:["pending","successful","failed"],
default:"pending"
}

},{
timestamps:true
});


module.exports = mongoose.model("Data", dataSchema);
