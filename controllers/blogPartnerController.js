const crypto = require("crypto");
const hashResetOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const BlogPartner = require("../models/BlogPartner");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const BlogCommission = require("../models/BlogCommission");
const BlogReferralClick = require("../models/BlogReferralClick");
const BlogPayout = require("../models/BlogPayout");
const WeeklyBlogPayout = require("../models/WeeklyBlogPayout");
const sendEmail = require("../services/emailService");
const PasswordReset = require("../models/PasswordReset");


// Admin create blog partner
const createPartner = async(req,res)=>{

try{

const {
name,
email,
password
}=req.body;

if(!name || !email || !password){
  return res.status(400).json({
    message:"Name, email and password are required"
  });
}


const generatedCode =
name.replace(/\s+/g,"")
.toUpperCase()
.slice(0,8)
+
Math.floor(1000 + Math.random() * 9000);


const existing = await BlogPartner.findOne({email});

if(existing){
return res.status(400).json({
message:"Partner already exists"
});
}


const hashed = await bcrypt.hash(password,10);

const otp = crypto.randomInt(100000, 1000000).toString();

const partner = await BlogPartner.create({

name,
email,
password:hashed,
code:generatedCode,
emailOtp:otp,
emailOtpExpires:new Date(Date.now() + 10 * 60 * 1000)

});

await sendEmail(
email,
"Verify your AlphaBot Blog Partner account",
`Your verification code is: ${otp}

This code expires in 10 minutes.`
);

res.json({
message:"Verification code sent to your email. Verify your account before logging in."
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};




// Admin get all blog partners
const getAllPartners = async(req,res)=>{

try{

const partners = await BlogPartner.find()
.select("-password")
.sort({createdAt:-1});


res.json(partners);


}catch(error){

res.status(500).json({
message:error.message
});

}

};




// Admin update blog partner
const adminUpdatePartner = async(req,res)=>{

try{

const partner = await BlogPartner.findById(req.params.id);

if(!partner){
return res.status(404).json({
message:"Partner not found"
});
}


const {
status,
commissionRate
}=req.body;


if(status){
partner.status=status;
}


if(commissionRate !== undefined){
partner.commissionRate=Number(commissionRate);
}


await partner.save();


res.json({
message:"Partner updated",
partner
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const getPartnerUsers = async(req,res)=>{

try{

const users = await User.find({
blogPartner:req.params.id
})
.select("name phone email createdAt");

res.json(users);

}catch(error){

res.status(500).json({
message:error.message
});

}

};

// Partner profile
const getPartner = async(req,res)=>{

try{

const partner = await BlogPartner.findById(
req.params.id
).select("-password");


const earnings = await BlogCommission.aggregate([
{
$match:{
blogPartner: partner._id
}
},
{
$group:{
_id:null,
totalGenerated:{
$sum:"$transactionAmount"
},
totalCommission:{
$sum:"$amount"
}
}
}
]);


if(!partner){
return res.status(404).json({
message:"Partner not found"
});
}


res.json({
...partner.toObject(),
totalGenerated: earnings[0]?.totalGenerated || 0,
totalCommission: earnings[0]?.totalCommission || 0
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


const getDashboard = async(req,res)=>{

try{

const partner = await BlogPartner.findById(req.blogPartner._id)
.select("-password");

if(!partner){
return res.status(404).json({
message:"Partner not found"
});
}


const users = await User.countDocuments({
blogPartner: partner._id
});


const lifetimeEarnings = await BlogCommission.aggregate([
{
$match:{
blogPartner: partner._id
}
},
{
$group:{
_id:null,
total:{
$sum:"$amount"
}
}
}
]);


const pendingPayout = await WeeklyBlogPayout.findOne({
blogPartner: partner._id,
status:"pending_admin_payment"
})
.sort({
createdAt:-1
});


const clicks = await BlogReferralClick.countDocuments({
blogPartner: partner._id
});

const conversions = await BlogReferralClick.countDocuments({
blogPartner: partner._id,
converted:true
});

const conversionRate = clicks === 0
? 0
: Number(((conversions / clicks) * 100).toFixed(2));


res.json({

name:partner.name,

code:partner.code,

users,

lifetimeCommission:
lifetimeEarnings[0]?.total || 0,

// Keep totalEarned for existing frontend compatibility
totalEarned:
lifetimeEarnings[0]?.total || 0,

pendingPayout:
pendingPayout?.commissionAmount || 0,
bankName: partner.bankName || "",
accountNumber: partner.accountNumber || "",
accountName: partner.accountName || "",

referralLink: `${process.env.FRONTEND_URL || ""}/register?ref=${partner.code}`,

clicks,

conversions,

conversionRate,
status: partner.status

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const getPayoutHistory = async(req,res)=>{

try{

const history = await WeeklyBlogPayout.find({
blogPartner:req.blogPartner._id,
status:"paid"
})
.sort({
paidAt:-1
});

res.json(history);


}catch(error){

res.status(500).json({
message:error.message
});

}

};


const getLeaderboard = async(req,res)=>{

try{

const leaderboard = await BlogPartner.aggregate([

{
$match:{
status:"active"
}
},

{
$lookup:{
from:"users",
localField:"_id",
foreignField:"blogPartner",
as:"users"
}
},

{
$project:{
name:1,
code:1,
users:{
$size:"$users"
},
}
},

{
$sort:{
users:-1
}
}

]);


res.json(leaderboard);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const loginPartner = async(req,res)=>{

try{

const {
email,
password
}=req.body;


const partner = await BlogPartner.findOne({
email
});


if(!partner){

return res.status(400).json({
message:"Invalid login details"
});

}


const valid = await bcrypt.compare(
password,
partner.password
);


if(!valid){

return res.status(400).json({
message:"Invalid login details"
});

}


const token = jwt.sign(

{
id:partner._id,
role:"blogPartner"
},

process.env.JWT_SECRET,

{
expiresIn:"7d"
}

);


res.json({

message:"Login successful",

token,

partner:{
id:partner._id,
name:partner.name,
code:partner.code,
status:partner.status
}

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const updatePayoutDetails = async(req,res)=>{

try{

const {
bankName,
accountNumber,
accountName
}=req.body;


const partner = req.blogPartner;


if(!partner){
return res.status(404).json({
message:"Partner not found"
});
}


partner.bankName = bankName || partner.bankName;
partner.accountNumber = accountNumber || partner.accountNumber;
partner.accountName = accountName || partner.accountName;


await partner.save();


res.json({

message:"Payout details updated",

bankName:partner.bankName,
accountNumber:partner.accountNumber,
accountName:partner.accountName

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};





const trackReferralClick = async(req,res)=>{
try{

const {code}=req.params;

const partner = await BlogPartner.findOne({
code:generatedCode,
status:"active"
});

if(!partner){
return res.status(404).json({
message:"Invalid referral link"
});
}

await BlogReferralClick.create({
code:partner.code,
blogPartner:partner._id,
ip:req.ip,
userAgent:req.headers["user-agent"]
});

res.json({
message:"Tracked",
redirect:`${process.env.FRONTEND_URL}/register?ref=${partner.code}`
});

}catch(error){

res.status(500).json({
message:error.message
});

}

};




const verifyBlogEmail = async(req,res)=>{

try{

const {email, otp}=req.body;

const partner = await BlogPartner.findOne({email});

if(!partner){
return res.status(404).json({
message:"Partner not found"
});
}

if(partner.emailVerified){
return res.json({
message:"Email already verified"
});
}

if(
partner.emailOtp !== otp ||
!partner.emailOtpExpires ||
partner.emailOtpExpires < new Date()
){
return res.status(400).json({
message:"Invalid or expired OTP"
});
}

partner.emailVerified = true;
partner.emailOtp = null;
partner.emailOtpExpires = null;
partner.status = "active";

await partner.save();

res.json({
message:"Email verified successfully"
});

}catch(error){

res.status(500).json({
message:error.message
});

}

};



const changePartnerPassword = async(req,res)=>{
try{

const {oldPassword,newPassword}=req.body;

const partner = await BlogPartner.findById(
req.blogPartner._id
);

if(!partner){
return res.status(404).json({
message:"Partner not found"
});
}

const match = await bcrypt.compare(
oldPassword,
partner.password
);

if(!match){
return res.status(400).json({
message:"Old password incorrect"
});
}

partner.password = await bcrypt.hash(newPassword,10);

await partner.save();

res.json({
message:"Password changed successfully"
});

}catch(error){

res.status(500).json({
message:error.message
});

}

};



const updatePartnerEmail = async(req,res)=>{
try{

const {email}=req.body;

const exists = await BlogPartner.findOne({
email
});

if(exists){
return res.status(400).json({
message:"Email already in use"
});
}

const partner = await BlogPartner.findById(
req.blogPartner._id
);

partner.email=email;
partner.emailVerified=false;

await partner.save();

res.json({
message:"Email updated. Please verify your new email."
});

}catch(error){

res.status(500).json({
message:error.message
});

}

};



const sendPartnerResetOTP = async(req,res)=>{
try{

const {email}=req.body;

const partner = await BlogPartner.findOne({
email:email.toLowerCase().trim()
});

if(!partner){
return res.status(404).json({
message:"Partner not found"
});
}

const otp = crypto.randomInt(100000, 1000000).toString();


await PasswordReset.deleteMany({
email:partner.email
});


await PasswordReset.create({
email:partner.email,
otp:hashResetOTP(otp),
expiresAt:new Date(
Date.now()+10*60*1000
)
});


await sendEmail(
partner.email,
"AlphaBot Partner Password Reset OTP",
`Your AlphaBot partner password reset OTP is ${otp}`
);


res.json({
message:"OTP sent successfully"
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const verifyPartnerResetOTP = async(req,res)=>{

try{

const {
email,
otp,
newPassword
}=req.body;


const cleanEmail=email.toLowerCase().trim();


const reset=await PasswordReset.findOne({
email:cleanEmail
});


if(!reset){

return res.status(400).json({
message:"Invalid OTP"
});

}

const otpHash = hashResetOTP(otp);

if(reset.otp !== otpHash && reset.otp !== otp){

return res.status(400).json({
message:"Invalid OTP"
});

}


if(reset.expiresAt < new Date()){

return res.status(400).json({
message:"OTP expired"
});

}


const partner=await BlogPartner.findOne({
email:cleanEmail
});


if(!partner){

return res.status(404).json({
message:"Partner not found"
});

}


partner.password=await bcrypt.hash(
newPassword,
10
);


await partner.save();


await PasswordReset.deleteOne({
_id:reset._id
});


res.json({
message:"Password reset successful"
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports={
createPartner,
getAllPartners,
adminUpdatePartner,
getPartner,
getDashboard,
getPayoutHistory,
getLeaderboard,
loginPartner,
updatePayoutDetails,
changePartnerPassword,
updatePartnerEmail,
getPartnerUsers,
trackReferralClick,
verifyBlogEmail,
verifyPartnerResetOTP,
sendPartnerResetOTP
};