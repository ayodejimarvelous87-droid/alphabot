const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const User = require("../models/User");
const AIConversation = require("../models/AIConversation");
const { getAIReply } = require("../services/aiService");


router.post("/chat", auth, async(req,res)=>{

try{

const {message}=req.body;


if(!message){
return res.status(400).json({
message:"Message required"
});
}


const user = await User.findOne({
phone:req.user.phone
});


const name = user?.name || "there";


// Save user message
let conversation = await AIConversation.findOne({
phone:req.user.phone
});


if(!conversation){

conversation = await AIConversation.create({
phone:req.user.phone,
messages:[]
});

}


conversation.messages.push({
role:"user",
content:message
});


await conversation.save();


// Send identity + memory context to AI
const reply = await getAIReply(
message,
{
name,
phone:req.user.phone,
history:conversation.messages.slice(-10)
}
);


// Save AI response
conversation.messages.push({
role:"assistant",
content:reply
});


await conversation.save();


const firstMessage = conversation.messages.length <= 2;

res.json({
reply: firstMessage
? `Hello ${name} 👋\n\n${reply}`
: reply
});


}catch(error){

console.log(error);

res.status(500).json({
message:error.message
});

}

});


module.exports = router;
