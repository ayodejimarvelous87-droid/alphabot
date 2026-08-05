const BlogCommission = require("../models/BlogCommission");
const BlogPartner = require("../models/BlogPartner");
const WeeklyBlogPayout = require("../models/WeeklyBlogPayout");


const startBlogCommissionUnlockCron = ()=>{

setInterval(async()=>{

try{

const partners = await BlogPartner.find({
status:"active"
});


for(const partner of partners){


const locked = await BlogCommission.find({
blogPartner:partner._id,
status:"pending"
})
.sort({
createdAt:1
});


if(!locked.length){
continue;
}

const firstTransaction = locked[0];

if(firstTransaction.availableAt > new Date()){
continue;
}


const totalSales = locked.reduce(
(sum,item)=>sum + Number(item.transactionAmount || 0),
0
);


const commissionAmount =
(totalSales * Number(partner.commissionRate || 30)) / 100;



const existing = await WeeklyBlogPayout.findOne({
blogPartner:partner._id,
status:"pending_admin_payment"
});


if(existing){
continue;
}



const now = new Date();

const weekStart = locked[0].createdAt;



await WeeklyBlogPayout.create({

blogPartner:partner._id,

weekStart,

weekEnd:now,

totalSales,

commissionAmount

});



await BlogCommission.updateMany(
{
_id:{
$in:locked.map(x=>x._id)
}
},
{
status:"processed"
}
);



console.log(
`Weekly blog payout created ₦${commissionAmount}`
);


}


}catch(error){

console.log(
"Blog commission unlock error:",
error.message
);

}


},60 * 60 * 1000);



console.log(
"Blog commission unlock cron started"
);


};


module.exports={
startBlogCommissionUnlockCron
};
