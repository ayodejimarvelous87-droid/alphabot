require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI)
.then(async()=>{

const admin = await Admin.findOne({username:"Alphabot"});

admin.tokenVersion += 1;

await admin.save();

console.log({
message:"Admin tokens revoked",
newTokenVersion:admin.tokenVersion
});

process.exit();

});
