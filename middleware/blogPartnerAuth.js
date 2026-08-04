const jwt = require("jsonwebtoken");
const BlogPartner = require("../models/BlogPartner");

const blogPartnerAuth = async(req,res,next)=>{

try{

const auth = req.headers.authorization;

if(!auth || !auth.startsWith("Bearer ")){
return res.status(401).json({
message:"Authentication required"
});
}

const token = auth.split(" ")[1];

const decoded = jwt.verify(
token,
process.env.JWT_SECRET
);


if(decoded.role !== "blogPartner"){
return res.status(403).json({
message:"Invalid account type"
});
}


const partner = await BlogPartner.findById(decoded.id);


if(!partner){
return res.status(404).json({
message:"Partner not found"
});
}


req.blogPartner = partner;

next();


}catch(error){

res.status(401).json({
message:"Invalid token"
});

}

};


module.exports = blogPartnerAuth;
