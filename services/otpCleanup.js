const cron = require("node-cron");
const PasswordReset = require("../models/PasswordReset");

function startOTPCleanup(){

cron.schedule("*/5 * * * *", async()=>{

try{

const result = await PasswordReset.deleteMany({
expiresAt:{
$lt:new Date()
}
});

if(result.deletedCount > 0){
console.log(
`Deleted ${result.deletedCount} expired OTP(s)`
);
}

}catch(error){

console.log(
"OTP cleanup error:",
error.message
);

}

});

console.log("OTP cleanup started");

}

module.exports = startOTPCleanup;
