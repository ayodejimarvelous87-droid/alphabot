require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI)
.then(async()=>{

const admin = await Admin.findOne({
username:"Alphabot"
});

const newPassword = "Youngnine1$";

admin.password = await bcrypt.hash(newPassword, 12);

admin.tokenVersion += 1;

await admin.save();

console.log({
message:"Admin password reset successfully",
username:admin.username,
newTokenVersion:admin.tokenVersion
});

process.exit();

});
