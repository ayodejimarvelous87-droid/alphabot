const BlogPartner = require("../models/BlogPartner");
const BlogPayout = require("../models/BlogPayout");
const BlogCommission = require("../models/BlogCommission");
const { createNotification } = require("../services/notificationService");
const sendEmail = require("../services/emailService");



const markBlogPaid = async(req,res)=>{

try{

const {
partnerId
}=req.body;


const partner = await BlogPartner.findById(partnerId);


if(!partner){
return res.status(404).json({
message:"Partner not found"
});
}


const pending = await BlogCommission.aggregate([

{
$match:{
blogPartner:partner._id,
createdAt:{
$gte:partner.lastPayoutDate
}
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


const amount = pending[0]?.total || 0;


if(amount <= 0){
return res.status(400).json({
message:"No pending payout"
});
}


const payout = await BlogPayout.create({

blogPartner:partner._id,

amount,

periodStart:partner.lastPayoutDate,

periodEnd:new Date(),

reference:"PAYOUT-"+Date.now()

});


partner.lastPayoutDate = new Date();

partner.payoutReminderSent = false;

await partner.save();


await createNotification(
null,
"Payout Completed",
`Your AlphaBot blog partner payout of ₦${amount} has been completed.`,
"payout",
null,
partner._id
);


await sendEmail(
partner.email,
"AlphaBot Blog Partner Payout Completed",
`Hello ${partner.name},

Your blog partner payout of ₦${amount} has been marked as paid.

Thank you for partnering with AlphaBot.`
);


res.json({

message:"Partner payout completed",

payout

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


const getPendingPayouts = async(req,res)=>{

try{

const partners = await BlogPartner.aggregate([

{
$match:{
status:"active"
}
},

{
$lookup:{
from:"blogcommissions",
let:{
partnerId:"$_id",
lastDate:"$lastPayoutDate"
},
pipeline:[
{
$match:{
$expr:{
$and:[
{
$eq:[
"$blogPartner",
"$$partnerId"
]
},
{
$gte:[
"$createdAt",
"$$lastDate"
]
}
]
}
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
],
as:"pending"
}
},

{
$project:{
name:1,
code:1,
bankName:1,
accountNumber:1,
accountName:1,
pendingPayout:{
$ifNull:[
{
$arrayElemAt:[
"$pending.total",
0
]
},
0
]
}
}
}

]);


res.json(partners);


}catch(error){

res.status(500).json({
message:error.message
});

}

};




const getPayoutHistory = async(req,res)=>{

try{

const history = await BlogPayout.find({
status:"paid"
})
.populate(
"blogPartner",
"name code"
)
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



module.exports={
markBlogPaid,
getPendingPayouts,
getPayoutHistory
};
