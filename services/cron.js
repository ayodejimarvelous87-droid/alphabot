const cron = require("node-cron");

const {
processRecurringPayments
} = require("./recurringService");

const updateFootballPoints = require("./footballPointsService");
const reconcileTransfers = require("./transferReconciliation");

const updateFootballMatches = require("./footballService");

const createFootballRewards = require("./footballRewardService");
const reconcileWallets = require("./walletReconciliationService");





function getPreviousWeek(){

const date=new Date();

date.setDate(
date.getDate()-7
);

return (
date.getFullYear()
+
"-"
+
Math.ceil(
(
(date-new Date(date.getFullYear(),0,1))
/86400000+1
)/7
)
);

}


function startCron(){


/*
Recurring payments
Runs every minute
*/

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




/*
Football updates
Runs every 6 hours
*/

cron.schedule("*/5 * * * *", async ()=>{

try{

await updateFootballMatches();

}catch(error){

console.log(
"Football cron error:",
error.message
);

}

});





/*
Football points update
Runs every hour
*/

cron.schedule("0 * * * *", async ()=>{

try{

await updateFootballPoints();

}catch(error){

console.log(
"Football points error:",
error.message
);

}

});





/*
Football rewards
Runs every Sunday midnight
*/

cron.schedule("0 0 * * 0", async ()=>{

try{

await createFootballRewards(getPreviousWeek());

}catch(error){

console.log(
"Football rewards cron error:",
error.message
);

}

});


/*
Wallet reconciliation
Runs every 6 hours
*/

cron.schedule("0 */6 * * *", async ()=>{

try{

await reconcileWallets();

}catch(error){

console.log(
"Wallet reconciliation cron error:",
error.message
);

}

});



/*
Bank transfer reconciliation
Runs every 2 minutes
*/

cron.schedule("*/2 * * * *", async ()=>{

try{

await reconcileTransfers();

}catch(error){

console.log(
"Transfer reconciliation cron error:",
error.message
);

}

});


console.log("Recurring cron started");
console.log("Football cron started");
console.log("Football rewards cron started");
console.log("Wallet reconciliation cron started");

}



module.exports = startCron;
