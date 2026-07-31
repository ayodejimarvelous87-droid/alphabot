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


const createLimiter = (
  windowMs,
  max,
  message,
  keyGenerator
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

    legacyHeaders:false,

    keyGenerator:keyGenerator || undefined

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



module.exports = {
  generalLimiter,
  loginLimiter,
  otpLimiter,
  otpPhoneLimiter,
  loginPhoneLimiter
};
