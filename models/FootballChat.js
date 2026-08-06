const mongoose = require("mongoose");

const footballChatSchema = new mongoose.Schema({

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
default:null
},

name:{
type:String,
required:true
},

message:{
type:String,
required:true,
maxlength:300
},

isBot:{
type:Boolean,
default:false
},

botType:{
type:String,
default:null
},

reactions:{

fire:{
type:Number,
default:0
},

laugh:{
type:Number,
default:0
},

football:{
type:Number,
default:0
},

agree:{
type:Number,
default:0
}

},

reactionUsers:{
type:Map,
of:[String],
default:{}
},

createdAt:{
type:Date,
default:Date.now,
expires:21600
}

});


module.exports = mongoose.model(
"FootballChat",
footballChatSchema
);
