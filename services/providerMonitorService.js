const ProviderHealth = require("../models/ProviderHealth");
const mongoose = require("mongoose");


const recordProviderResult = async ({
  provider,
  service,
  success,
  responseTime = 0,
  error = null
}) => {

  try {

    if (mongoose.connection.readyState !== 1) {
      return;
    }

    let record = await ProviderHealth.findOne({
      provider,
      service
    });

    if (!record) {

      record = await ProviderHealth.create({
        provider,
        service,
        recentResults: []
      });

    }


    /*
     * ROLLING PROVIDER HEALTH
     *
     * Only the latest 20 provider results are used
     * to calculate availability and response time.
     */

    record.recentResults.push({
      success: Boolean(success),
      responseTime: Number(responseTime) || 0,
      error: error || null,
      timestamp: new Date()
    });


    // Keep ONLY the latest 20 results.
    if (record.recentResults.length > 20) {

      record.recentResults =
        record.recentResults.slice(-20);

    }


    const results = record.recentResults;


    const successCount =
      results.filter(result => result.success).length;

    const failureCount =
      results.length - successCount;


    /*
     * Keep these fields synchronized with the
     * rolling 20-result window.
     */

    record.successCount = successCount;
    record.failureCount = failureCount;


    /*
     * Average response time is also based only
     * on the latest 20 results.
     */

    if (results.length > 0) {

      const totalResponseTime =
        results.reduce(
          (total, result) =>
            total + (Number(result.responseTime) || 0),
          0
        );

      record.averageResponseTime =
        Math.round(
          totalResponseTime / results.length
        );

    }
    else {

      record.averageResponseTime = 0;

    }


    /*
     * Availability is:
     *
     * successful results / total recent results * 100
     */

    const availability =
      results.length > 0
        ? Math.round(
            (successCount / results.length) * 100
          )
        : 100;


    /*
     * Update timestamps.
     */

    if (success) {

      record.lastSuccess = new Date();

    }
    else {

      record.lastFailure = new Date();
      record.lastError =
        error || "Unknown provider error";

    }


    /*
     * Status is based on the latest rolling window.
     */

    if (results.length === 0) {

      record.status = "online";

    }
    else if (availability < 50) {

      record.status = "offline";

    }
    else if (availability < 90) {

      record.status = "degraded";

    }
    else {

      record.status = "online";

    }


    await record.save();


  } catch (err) {

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
