const User = require("../models/User");
const BlogPartner = require("../models/BlogPartner");
const BlogCommission = require("../models/BlogCommission");


const addBlogCommission = async({
phone,
amount,
reference,
service
})=>{

try{

const user = await User.findOne({
phone
});


if(!user || !user.blogPartner){
return;
}


const blog = await BlogPartner.findById(
user.blogPartner
);


if(!blog || blog.status !== "active"){
return;
}


const existing = await BlogCommission.findOne({
reference
});


if(existing){
return;
}


const commission =
(Number(amount) * Number(blog.commissionRate || 0)) / 100;


await BlogCommission.create({

blogPartner:blog._id,

user:user._id,

reference,

amount:commission,

transactionAmount:Number(amount),

service:service || "unknown",

transactionReference:reference

});


blog.totalEarned =
Number(blog.totalEarned || 0) + commission;


await blog.save();


}catch(error){

console.log(
"Blog commission error:",
error.message
);

}

};


module.exports={
addBlogCommission
};
