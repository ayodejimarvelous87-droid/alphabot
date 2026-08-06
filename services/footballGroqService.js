require("dotenv").config();

const Groq = require("groq-sdk");
const {getFootballKnowledge}=require("./footballKnowledgeService");
const {client}=require("./redisService");
const SystemSetting = require("../models/SystemSetting");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


async function getFootballAIReply({
personality,
message,
context=""
}){


try{

const setting = await SystemSetting.findOne();

if(setting && setting.footballAIEnabled === false){
  return null;
}

const cacheKey = `footballAI:${personality}:${message.toLowerCase().trim()}`;

try{
  const cached = await client.get(cacheKey);

  if(cached){
    return cached;
  }
}catch(e){
  console.log("Football AI cache read error:", e.message);
}

const analystStyle =
setting?.footballAnalystStyle || "balanced";

const goalMasterStyle =
setting?.footballGoalMasterStyle || "hype";


const response = await groq.chat.completions.create({

model:"llama-3.1-8b-instant",

messages:[

{
role:"system",
content:
`
You are ${personality} inside AlphaBot Football Arena.

Keep replies between 4-6 lines maximum.

Discuss football naturally:
- matches
- tactics
- transfers
- teams
- players
- football debates

Rules:
- Never invent live scores.
- Never claim teams are playing today unless provided in football context.
- If a match is not in the provided data, treat it as a general football debate.
- Use provided football context only for match-specific questions.
- Do not force context matches into general football discussions.
- For general football topics, discuss major leagues, clubs, players, tactics, transfers and football culture.
- If no relevant current data exists, give general football opinions.
- Never mention random teams from context unless they relate to the user's question.
- Be conversational and entertaining.

Personality rules:

If you are ⚽ AlphaBot Analyst:
- Be calm and tactical.
- Focus on form, strategy, squad quality and football analysis.
- Explain your reasoning.
- Current analyst style: ${analystStyle}

If you are 🔥 GoalMaster AI:
- Be energetic and passionate.
- Sound like a football fan.
- Add humour, excitement and strong opinions.
- Encourage debates.
- Current GoalMaster style: ${goalMasterStyle}

`
},

{
role:"user",
content:
`
Football context:
${context}

Football knowledge:
${getFootballKnowledge()}

User message:
${message}
`
}

],

temperature:0.8,
max_tokens:150

});


const reply = response.choices[0].message.content.slice(0,300);

try{
  await client.setEx(
    cacheKey,
    1800,
    reply
  );
}catch(e){
  console.log("Football AI cache write error:", e.message);
}

return reply;


}catch(error){

console.log(
"Football Groq error:",
error.message
);

return "⚽ The fans are debating this one! What do you think about it?";

}

}


module.exports = {
getFootballAIReply
};
