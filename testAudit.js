require("dotenv").config();
const mongoose = require("mongoose");
const AuditLog = require("./models/AuditLog");

mongoose.connect(process.env.MONGO_URI)
.then(async()=>{

const logs = await AuditLog.find()
.sort({createdAt:-1})
.limit(5);

console.log(logs);

process.exit();

})
.catch(err=>{
console.log(err);
process.exit();
});
