const BlogPartner = require("../models/BlogPartner");
const BlogCommission = require("../models/BlogCommission");
const { createNotification } = require("./notificationService");


const startBlogPayoutReminderCron = ()=>{

setInterval(async()=>{

try{

const partners = await BlogPartner.find({
status:"active",
payoutReminderSent:false
});


for(const partner of partners){


const sevenDays = new Date(
partner.lastPayoutDate.getTime() +
7 * 24 * 60 * 60 * 1000
);


if(new Date() < sevenDays){
continue;
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
continue;
}


await createNotification(
"admin",
"Blog payout due",
`${partner.name} has reached the 7-day payout cycle. Amount due: ₦${amount}`
);


partner.payoutReminderSent = true;

await partner.save();


}


}catch(error){

console.log(
"Blog payout reminder error:",
error.message
);

}

},24 * 60 * 60 * 1000);


console.log(
"Blog payout reminder cron started"
);

};


module.exports={
startBlogPayoutReminderCron
};
