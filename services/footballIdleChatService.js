const FootballChat = require("../models/FootballChat");
const {getFootballAIReply}=require("./footballGroqService");
const {getFootballContext}=require("./footballContextService");
const SystemSetting = require("../models/SystemSetting");


async function runFootballIdleChat(){

try{

const setting = await SystemSetting.findOne();

if(setting && setting.footballIdleChatEnabled === false){
  return;
}

const interval =
(setting?.footballIdleChatInterval || 5) * 60 * 1000;


const fiveMinutesAgo = new Date(
Date.now() - interval
);


// Check latest human message only
const lastHuman = await FootballChat.findOne({
isBot:false
})
.sort({
createdAt:-1
});


const lastBot = await FootballChat.findOne({
isBot:true
})
.sort({
createdAt:-1
});


if(
(lastHuman && lastHuman.createdAt > fiveMinutesAgo) ||
(lastBot && lastBot.createdAt > fiveMinutesAgo)
){

return;

}


// Create AI generated idle discussion

const context = await getFootballContext();

const recentBots = await FootballChat.find({
isBot:true
})
.sort({
createdAt:-1
})
.limit(6);


const previousTopics = recentBots.map(chat=>chat.message).join("\n");


const analystReply = await getFootballAIReply({

personality:"⚽ AlphaBot Analyst",

message:`Start a football discussion about transfers, teams, tactics, upcoming competitions or interesting football topics.

Avoid repeating these previous discussions:
${previousTopics}`,

context

});


const goalMasterReply = await getFootballAIReply({

personality:"🔥 GoalMaster AI",

message:`React to this Analyst opinion:

"${analystReply}"

Give a passionate fan response.
Challenge the opinion, agree, or add your own football argument.
Keep your personality energetic.`,

context

});


if(!analystReply || !goalMasterReply){
  console.log("Skipping idle chat - AI unavailable");
  return;
}

const replies = [
analystReply,
goalMasterReply
];


const topics = [

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


for(const bot of topics){

await FootballChat.create({

user:null,

name:bot.name,

message:bot.message,

isBot:true,

botType:bot.botType

});

}


console.log("Football idle chat generated");


}catch(error){

console.log(
"Football idle chat error:",
error.message
);

}


}


module.exports = runFootballIdleChat;
