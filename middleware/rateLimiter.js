const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { createClient } = require("redis");


const redisClient = createClient({
  url: process.env.REDIS_URL
});


redisClient.on(
  "error",
  (err)=>{
    console.log("Redis error:", err.message);
  }
);


let redisReady = false;


const connectRedis = async()=>{

  if(redisClient.isOpen){
    return;
  }

  console.log("Redis connecting...");

  await redisClient.connect();

  redisReady = true;

  console.log("Redis connected");

};




const checkRedisStatus = async()=>{

  try{

    if(!redisClient.isOpen){
      return "disconnected";
    }

    await Promise.race([
      redisClient.ping(),
      new Promise((_, reject)=>
        setTimeout(()=>reject(new Error("Redis timeout")),2000)
      )
    ]);

    return "connected";

  }catch(error){

    return "disconnected";

  }

};


const createLimiter = (
  windowMs,
  max,
  message,
  keyGenerator
)=>{

  return rateLimit({

    store:new RedisStore({

        prefix: "alphabot_rl:",

      sendCommand:async(...args)=>{

        if(!redisReady){
          await connectRedis();
        }

        return redisClient.sendCommand(args);

      }

    }),

    windowMs,

    max,

    message:{
      message
    },

    standardHeaders:true,

    legacyHeaders:false,

      validate: {
        singleCount: false
      },

      keyGenerator:
        keyGenerator ||
        ((req)=>{
          return ipKeyGenerator(req.ip);
        })

  });

};



const generalLimiter = createLimiter(
  15 * 60 * 1000,
  200,
  "Too many requests. Please try again later."
);


const loginLimiter = createLimiter(
  15 * 60 * 1000,
  15,
  "Too many login attempts. Try again later."
);


const loginPhoneLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  "Too many login attempts for this account. Try again later.",
  (req)=>{
    return req.body.phone || ipKeyGenerator(req.ip);
  }
);


const otpLimiter = createLimiter(
  10 * 60 * 1000,
  20,
  "Too many OTP attempts. Try again later."
);


const otpPhoneLimiter = createLimiter(
  60 * 60 * 1000,
  3,
  "Too many OTP requests for this phone. Try again later.",
  (req)=>{
    return req.body.phone || ipKeyGenerator(req.ip);
  }
);


const purchaseLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  "Too many purchase attempts. Try again later."
);


module.exports = {
  generalLimiter,
  loginLimiter,
  loginPhoneLimiter,
  otpLimiter,
  otpPhoneLimiter,
  purchaseLimiter,
  redisClient,
  getRedisStatus:()=>{
    return redisClient.isOpen ? "connected" : "disconnected";
  },
  checkRedisStatus
};
