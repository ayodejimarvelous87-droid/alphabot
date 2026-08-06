const BlogPartner = require("../models/BlogPartner");
const WeeklyBlogPayout = require("../models/WeeklyBlogPayout");
const { createNotification } = require("../services/notificationService");
const sendEmail = require("../services/emailService");



const markBlogPaid = async(req,res)=>{

try{

const {id}=req.params;


const payout = await WeeklyBlogPayout.findById(id);


if(!payout){

return res.status(404).json({
message:"Weekly payout not found"
});

}


if(payout.status==="paid"){

return res.status(400).json({
message:"Already paid"
});

}


const partner = await BlogPartner.findById(
payout.blogPartner
);

payout.status="paid";
payout.paidAt=new Date();

await payout.save();



await createNotification(
null,
"Blog payout completed",
`Your AlphaBot blog payout of ₦${payout.commissionAmount} has been paid.`,
"payout",
null,
payout.blogPartner
);

if(partner?.email){

await sendEmail(
partner.email,
"AlphaBot Blog Payout Completed",
`
Hello ${partner.name},

Your AlphaBot blog payout of ₦${payout.commissionAmount} has been marked as paid.

Thank you for partnering with AlphaBot.
`
);

}



res.json({

message:"Weekly blog payout marked as paid",

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

const payouts = await WeeklyBlogPayout.find({
status:"pending_admin_payment"
})
.populate(
"blogPartner",
"name code bankName accountNumber accountName"
)
.sort({
createdAt:-1
});


res.json(payouts);


}catch(error){

res.status(500).json({
message:error.message
});

}

};


const getPayoutHistory = async(req,res)=>{

try{

const history = await WeeklyBlogPayout.find({
status:"paid"
})
.populate(
"blogPartner",
"name code email"
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
