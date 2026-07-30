const rateLimit = require("express-rate-limit");
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


const createLimiter = (
  windowMs,
  max,
  message
)=>{

  return rateLimit({

    store: new RedisStore({

      sendCommand: async(...args)=>{

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

    legacyHeaders:false

  });

};



const generalLimiter = createLimiter(
  15 * 60 * 1000,
  200,
  "Too many requests. Please try again later."
);


const loginLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Too many login attempts. Try again later."
);


const otpLimiter = createLimiter(
  10 * 60 * 1000,
  5,
  "Too many OTP attempts. Try again later."
);



module.exports = {
  generalLimiter,
  loginLimiter,
  otpLimiter
};
