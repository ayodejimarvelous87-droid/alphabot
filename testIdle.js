require("dotenv").config();
const mongoose = require("mongoose");
const runFootballIdleChat = require("./services/footballIdleChatService");

async function run(){

await mongoose.connect(process.env.MONGO_URI);

console.log("Mongo connected");

await runFootballIdleChat();

await mongoose.disconnect();

}

run();
