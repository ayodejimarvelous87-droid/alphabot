const Admin = require("../models/Admin");
const AdminOTP = require("../models/AdminOTP");
const jwt = require("jsonwebtoken");
const sendEmail = require("../services/emailService");


// Step 1: Username + password login

const adminLogin = async (req, res) => {

try {

const { username, password } = req.body;


const admin = await Admin.findOne({
username
});


if(!admin){

return res.status(401).json({
message:"Invalid username or password"
});

}


if(admin.password !== password){

return res.status(401).json({
message:"Invalid username or password"
});

}


// Generate OTP

const otp = Math.floor(
100000 + Math.random() * 900000
).toString();


await AdminOTP.deleteMany({
username
});


await AdminOTP.create({

username,

otp,

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

res.status(500).json({
message:error.message
});

}

};





// Step 2: Verify OTP

const verifyAdminOTP = async(req,res)=>{

try{


const {username, otp}=req.body;


const record = await AdminOTP.findOne({
username
});


if(!record){

return res.status(400).json({
message:"OTP not found or expired"
});

}



if(record.expiresAt < new Date()){

await AdminOTP.deleteOne({
_id:record._id
});


return res.status(400).json({
message:"OTP expired"
});

}



if(record.otp !== otp){


record.attempts += 1;

await record.save();



if(record.attempts >= 5){

await AdminOTP.deleteOne({
_id:record._id
});


return res.status(400).json({
message:"Too many failed attempts"
});

}



return res.status(400).json({
message:"Invalid OTP"
});

}



await AdminOTP.deleteOne({
_id:record._id
});



const admin = await Admin.findOne({
username
});



const token = jwt.sign(
{
id:admin._id,
role:"admin"
},
process.env.JWT_SECRET,
{
expiresIn:"7d"
}
);



res.json({

message:"Login successful",

token

});



}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports={
adminLogin,
verifyAdminOTP
};
