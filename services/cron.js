const cron = require("node-cron");

const {
processRecurringPayments
} = require("./recurringService");


function startCron(){

cron.schedule("* * * * *", async ()=>{

try{

await processRecurringPayments();

}catch(error){

console.log(
"Recurring cron error:",
error.message
);

}

});

console.log("Recurring cron started");

}


module.exports = startCron;
