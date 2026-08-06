const express = require("express");
const FootballChat = require("../models/FootballChat");
const {getFootballContext}=require("../services/footballContextService");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();


function delay(ms){
return new Promise(resolve=>setTimeout(resolve,ms));
}


const { client } = require("../services/redisService");
const {
getFootballAIReply
} = require("../services/footballGroqService");

const {
shouldReply
} = require("../services/footballChatAIService");


async function canSendMessage(userId){

const key = `football_chat:${userId}`;

const count = await client.incr(key);


if(count === 1){

await client.expire(key,60);

}


return count <= 5;

}


// Get football chat messages
router.get("/", auth, async(req,res)=>{

try{

const messages = await FootballChat.find()
.sort({
createdAt:-1
})
.limit(100);

messages.reverse();


const formattedMessages = messages.map(chat=>({

...chat.toObject(),

reactions:chat.reactions || {
fire:0,
laugh:0,
football:0,
agree:0
}

}));


res.json(formattedMessages);


}catch(error){

res.status(500).json({
message:error.message
});

}

});



// Send football chat message
router.post("/", auth, async(req,res)=>{

try{

const {message}=req.body;


if(!(await canSendMessage(req.user.id))){

return res.status(429).json({
message:"Slow down ⚽ Too many messages"
});

}


if(!message || !message.trim()){

return res.status(400).json({
message:"Message required"
});

}


const user = await User.findById(req.user.id);


if(!user){

return res.status(404).json({
message:"User not found"
});

}


const chat = await FootballChat.create({

user:user._id,

name:user.name,

message:message.trim()

});





res.json(chat);


// AI football replies in background
if(shouldReply(message)){

(async()=>{

const context = await getFootballContext();

const replies = await Promise.all([
getFootballAIReply({
personality:"⚽ AlphaBot Analyst",
message,
context
}),
getFootballAIReply({
personality:"🔥 GoalMaster AI",
message,
context
})
]);


const botReplies = [
{
name:"⚽ AlphaBot Analyst",
botType:"analyst",
message:replies[0]
},
{
name:"🔥 GoalMaster AI",
botType:"goalmaster",
message:replies[1]
}
];


for(const reply of botReplies){


await delay(reply.botType === "analyst" ? 5000 : 8000);


await FootballChat.create({

user:null,

name:reply.name,

message:reply.message,

isBot:true,

botType:reply.botType

});


}

})();

}


}catch(error){

res.status(500).json({
message:error.message
});

}

});




// React to football chat message
router.post("/:id/react", auth, async(req,res)=>{

try{

const {reaction}=req.body;


const allowed=[
"fire",
"laugh",
"football",
"agree"
];


if(!allowed.includes(reaction)){

return res.status(400).json({
message:"Invalid reaction"
});

}


const chat = await FootballChat.findById(
req.params.id
);


if(!chat){

return res.status(404).json({
message:"Chat message not found"
});

}


if(!chat.reactionUsers){
chat.reactionUsers = new Map();
}

const users = chat.reactionUsers.get(reaction) || [];


if(users.includes(req.user.id)){

return res.json({
message:"Already reacted",
reactions:chat.reactions
});

}


users.push(req.user.id);


chat.reactions[reaction] += 1;

chat.reactionUsers.set(
reaction,
users
);


await chat.save();


res.json({

success:true,

reactions:chat.reactions

});


}catch(error){

res.status(500).json({
message:error.message
});

}

});


module.exports = router;
