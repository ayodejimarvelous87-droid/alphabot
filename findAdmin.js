require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI)
.then(async()=>{

const admin = await Admin.findOne({username:"Alphabot"});

console.log({
username:admin.username,
email:admin.email,
id:admin._id
});

process.exit();

});
