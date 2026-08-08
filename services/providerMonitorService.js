const ProviderHealth = require("../models/ProviderHealth");
const mongoose = require("mongoose");


const recordProviderResult = async ({
  provider,
  service,
  success,
  responseTime = 0,
  error = null
}) => {

try{

if(mongoose.connection.readyState !== 1){
  return;
}

  let record = await ProviderHealth.findOne({

  provider,
  service
});


if(!record){

record = await ProviderHealth.create({
  provider,
  service
});

}


// success case
if(success){

record.successCount += 1;
record.lastSuccess = new Date();

}


// failure case
else{

record.failureCount += 1;
record.lastFailure = new Date();
record.lastError = error || "Unknown provider error";

}


// calculate simple average response time

const totalCalls =
record.successCount + record.failureCount;


record.averageResponseTime =
Math.round(
(
(record.averageResponseTime * (totalCalls - 1))
+
responseTime
)
/
totalCalls
);


// status calculation

if(record.failureCount > 5 &&
record.failureCount > record.successCount){

record.status = "offline";

}
else if(record.failureCount > 2){

record.status = "degraded";

}
else{

record.status = "online";

}


await record.save();


}catch(err){

console.log(
"Provider monitor failed:",
err.message
);

}

};




const canUseProvider = async ({
  provider,
  service
}) => {

  let record;

  try {

    if(mongoose.connection.readyState !== 1){
        return true;
      }

      record = await ProviderHealth.findOne({

      provider,
      service
    });

  } catch(error) {

    console.log(
      "Provider health check skipped:",
      error.message
    );

    return true;

  }


  if(!record){
    return true;
  }


  if(record.status !== "offline"){
    return true;
  }


  const cooldown = 10 * 60 * 1000;


  const lastFailure =
    record.lastFailure
      ? new Date(record.lastFailure).getTime()
      : 0;


  if(Date.now() - lastFailure > cooldown){

    console.log(
      `Circuit breaker half-open: ${provider} ${service}`
    );

    return true;

  }


  return false;

};

module.exports = {
recordProviderResult,
canUseProvider
};
