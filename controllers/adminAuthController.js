const crypto = require("crypto");
const hashAdminOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const AppError = require("../utils/AppError");
const auditLogger = require("../services/auditLogger");
const Admin = require("../models/Admin");
const User = require("../models/User");
const AdminOTP = require("../models/AdminOTP");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendEmail = require("../services/emailService");


// Step 1: Username + password login

const adminLogin = async (req, res) => {

try {

const { username, password } = req.body;


let admin = await Admin.findOne({
username
});

let accountType = "admin";


// If this is not an original Admin account,
// check whether it is an upgraded User account.
if(!admin){

admin = await User.findOne({
phone:username,
role:"admin"
});

accountType = "user";

if(admin && admin.status !== "active"){

return res.status(403).json({
message:
admin.status === "suspended"
? "Account suspended"
: "Account deleted"
});

}

}


if(!admin){

return res.status(401).json({
message:"Invalid username/phone or password"
});

}


const validPassword = await bcrypt.compare(
password,
admin.password
);


if(!validPassword){

return res.status(401).json({
message:"Invalid username or password"
});

}


// Generate OTP

const otp = crypto.randomInt(100000, 1000000).toString();


await AdminOTP.deleteMany({
username,
accountType
});


await AdminOTP.create({

username,

accountType,

otp:hashAdminOTP(otp),

expiresAt:new Date(
Date.now() + 5 * 60 * 1000
)

});



await sendEmail(
admin.email,
"AlphaBot Admin Login OTP",
`Your AlphaBot admin login OTP is ${otp}. It expires in 5 minutes.`
);



res.json({

message:"OTP sent to admin email",

requiresOTP:true

});


}catch(error){

res.status(error.statusCode || 500).json({
message:error.message
});

}

};





// Step 2: Verify OTP

const verifyAdminOTP = async(req,res)=>{

try{


const {username, otp}=req.body;


const adminAccount = await Admin.findOne({
username
});

const userAccount = await User.findOne({
phone:username,
role:"admin"
});

let accountType;

if(adminAccount){
accountType = "admin";
}else if(userAccount){
accountType = "user";
}else{
throw new AppError(
"Invalid username/phone",
401
);
}

const record = await AdminOTP.findOne({
username,
accountType
});


if(!record){

throw new AppError(
  "OTP not found or expired",
  400
);

}
if(record.attempts >= 5){
return res.status(429).json({
message:"Too many OTP attempts"
});
}




if(record.expiresAt < new Date()){

await AdminOTP.deleteOne({
_id:record._id
});


throw new AppError(
  "OTP expired",
  400
);

}



const otpHash = hashAdminOTP(otp);

if(record.otp !== otpHash){


record.attempts += 1;

await record.save();



if(record.attempts >= 5){

await AdminOTP.deleteOne({
_id:record._id
});


throw new AppError(
  "Too many failed attempts",
  429
);

}



throw new AppError(
  "Invalid OTP",
  400
);

}



await AdminOTP.deleteOne({
_id:record._id
});



let admin;

if(record.accountType === "user"){

admin = await User.findOne({
phone:username,
role:"admin"
});

}else{

admin = await Admin.findOne({
username
});

}


if(!admin){

throw new AppError(
"Admin account not found",
404
);

}


const token = jwt.sign(
{
id:admin._id,
role:"admin",
phone:admin.phone || undefined,
tokenVersion:admin.tokenVersion,
},
process.env.JWT_SECRET,
{
expiresIn:"7d"
}
);


await auditLogger({
actor:admin._id.toString(),
role:"admin",
action:"ADMIN_LOGIN_SUCCESS",
target:username,
ip:req.ip,
userAgent:req.headers["user-agent"]
});


res.json({

message:"Login successful",

token

});



}catch(error){

res.status(error.statusCode || 500).json({
message:error.message
});

}

};



module.exports={
adminLogin,
verifyAdminOTP
};
