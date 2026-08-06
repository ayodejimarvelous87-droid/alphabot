const { getFootballAIReply } = require("./footballGroqService");


function shouldReply(message){

const text = message.toLowerCase();

const mentionTriggers = [
"goalmaster",
"goal master",
"@goalmaster",
"@goal master"
];

if(mentionTriggers.some(word=>text.includes(word))){
return true;
}

const triggers = [

"football",
"soccer",
"world cup",
"champions league",
"premier league",
"la liga",
"laliga",
"bundesliga",
"serie a",
"club",
"team",
"player",
"manager",
"coach",
"transfer",
"transfers",
"signing",
"squad",
"season",
"match",
"game",
"derby",
"rivalry",
"goal",
"goals",
"score",
"scored",
"winner",
"won",
"win",
"beat",
"lost",
"best player",
"top scorer",
"ballon",
"trophy",
"cup",
"lineup",
"formation",
"tactics",
"opinion",
"thoughts",
"predict",
"prediction",
"compare",
"vs"

];

return triggers.some(word=>text.includes(word));

}


async function generateReplies(message, context=""){


if(!shouldReply(message)){

return [];

}


const analyst = await getFootballAIReply({

personality:"⚽ AlphaBot Analyst",

message,

context

});


const goalmaster = await getFootballAIReply({

personality:"🔥 GoalMaster AI",

message: analyst,

context

});


return [

{
name:"⚽ AlphaBot Analyst",
botType:"analyst",
message:analyst
},

{
name:"🔥 GoalMaster AI",
botType:"goalmaster",
message:goalmaster
}

];


}



async function generateDiscussion(context=""){


const analyst = await getFootballAIReply({

personality:"⚽ AlphaBot Analyst",

message:"Start a football discussion topic.",

context

});


const goalmaster = await getFootballAIReply({

personality:"🔥 GoalMaster AI",

message:analyst,

context

});


return [

{
name:"⚽ AlphaBot Analyst",
botType:"analyst",
message:analyst
},

{
name:"🔥 GoalMaster AI",
botType:"goalmaster",
message:goalmaster
}

];


}



module.exports = {
generateReplies,
generateDiscussion,
shouldReply
};
