const Admin = require("../models/Admin");
const User = require("../models/User");

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


// Original Admin account
let admin = await Admin.findById(req.user.id);

if(admin){

if(admin.tokenVersion !== req.user.tokenVersion){

return res.status(401).json({
message:"Admin token revoked"
});

}

req.admin = admin;

next();

return;

}


// Upgraded User account
const userAdmin = await User.findOne({
_id:req.user.id,
role:"admin"
});


if(!userAdmin){

return res.status(403).json({
message:"Admin account no longer exists"
});

}


if(userAdmin.tokenVersion !== req.user.tokenVersion){

return res.status(401).json({
message:"Admin token revoked"
});

}


// This remains the SAME User account.
// Its existing wallet is untouched.
req.admin = userAdmin;


next();


}catch(error){

return res.status(500).json({
message:"Admin verification failed"
});

}

};
