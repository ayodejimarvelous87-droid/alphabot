
const User = require("../models/User");
const BlogPartner = require("../models/BlogPartner");
const BlogWeeklyCommission = require("../models/BlogWeeklyCommission");


function getWeek(){

const d=new Date();

const year=d.getFullYear();

const week=Math.ceil(
(
(
d - new Date(year,0,1)
)/86400000 + 1
)/7
);

return `${year}-${week}`;

}


const addBlogCommission = async({
phone,
amount
})=>{

try{

const user=await User.findOne({phone});

if(!user || !user.blogPartner){
return;
}


const blog=await BlogPartner.findById(
user.blogPartner
);


if(!blog || blog.status!=="active"){
return;
}


const week=getWeek();


let earning =
await BlogWeeklyCommission.findOne({

blogPartner:blog._id,
week

});


if(!earning){

earning =
await BlogWeeklyCommission.create({

blogPartner:blog._id,
week

});

}


earning.totalSales += Number(amount);


earning.commission =
(
earning.totalSales *
Number(blog.commissionRate || 30)
)/100;


await earning.save();


}catch(error){

console.log(
"Weekly blog commission error:",
error.message
);

}

};


module.exports={
addBlogCommission
};
