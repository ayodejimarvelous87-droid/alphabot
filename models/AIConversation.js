const mongoose = require("mongoose");

const aiConversationSchema = new mongoose.Schema(
{
  phone:{
    type:String,
    required:true
  },

  messages:[
    {
      role:{
        type:String,
        enum:["user","assistant"],
        required:true
      },

      content:{
        type:String,
        required:true
      },

      createdAt:{
        type:Date,
        default:Date.now
      }
    }
  ]
},
{
  timestamps:true
}
);

module.exports = mongoose.model(
  "AIConversation",
  aiConversationSchema
);
