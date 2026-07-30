const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
actor:{
type:String,
default:null
},

role:{
type:String,
default:"user"
},

action:{
type:String,
required:true
},

target:{
type:String,
default:null
},

ip:{
type:String,
default:null
},

userAgent:{
type:String,
default:null
},

details:{
type:Object,
default:{}
}

},{
timestamps:true
});

module.exports = mongoose.model(
"AuditLog",
auditSchema
);
