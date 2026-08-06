const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL
});

client.on("error", (err)=>{
  console.log("Redis error:", err.message);
});

let connected = false;

async function connectRedis(){

if(!connected){

await client.connect();

connected = true;

console.log("Redis connected");

}

}


module.exports = {
client,
connectRedis
};
