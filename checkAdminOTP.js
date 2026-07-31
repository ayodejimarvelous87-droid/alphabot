require("dotenv").config();
const mongoose = require("mongoose");
const AdminOTP = require("./models/AdminOTP");

mongoose.connect(process.env.MONGO_URI)
.then(async()=>{

const records = await AdminOTP.find();
console.log(records);

process.exit();

});
