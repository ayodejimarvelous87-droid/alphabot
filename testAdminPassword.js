require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI)
.then(async()=>{

const admin = await Admin.findOne({
username:"Alphabot"
});

const password = "Youngnine1$";

const result = await bcrypt.compare(
password,
admin.password
);

console.log({
passwordMatch: result
});

process.exit();

});
