const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({

username:{
type:String,
required:true,
unique:true
},

tokenVersion:{
type:Number,
default:0
},

password:{
type:String,
required:true
},

email:{
type:String,
required:true
}

},{
timestamps:true
});


module.exports = mongoose.model(
"Admin",
adminSchema
);
