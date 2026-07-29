const rateLimit = require("express-rate-limit");


// General API protection
const generalLimiter = rateLimit({

windowMs: 15 * 60 * 1000,

max: 200,

message:{
message:"Too many requests. Please try again later."
},

standardHeaders:true,

legacyHeaders:false

});



// Login protection
const loginLimiter = rateLimit({

windowMs: 15 * 60 * 1000,

max: 5,

message:{
message:"Too many login attempts. Try again later."
},

standardHeaders:true,

legacyHeaders:false

});



// OTP protection
const otpLimiter = rateLimit({

windowMs: 10 * 60 * 1000,

max: 5,

message:{
message:"Too many OTP attempts. Try again later."
},

standardHeaders:true,

legacyHeaders:false

});


module.exports = {
generalLimiter,
loginLimiter,
otpLimiter
};
