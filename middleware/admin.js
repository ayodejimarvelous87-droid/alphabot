const Admin = require("../models/Admin");

module.exports = async function(req,res,next){

try{

if(!req.user){

return res.status(401).json({
message:"Unauthorized"
});

}


if(req.user.role !== "admin"){

return res.status(403).json({
message:"Admin access required"
});

}


const admin = await Admin.findById(req.user.id);


if(!admin){

return res.status(403).json({
message:"Admin account no longer exists"
});

}


if(admin.tokenVersion !== req.user.tokenVersion){

return res.status(401).json({
message:"Admin token revoked"
});

}


req.admin = admin;


next();


}catch(error){

return res.status(500).json({
message:"Admin verification failed"
});

}

};
