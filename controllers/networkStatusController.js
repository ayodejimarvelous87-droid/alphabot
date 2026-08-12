const ProviderHealth = require("../models/ProviderHealth");

const NETWORKS = [
  "MTN",
  "AIRTEL",
  "GLO",
  "9MOBILE"
];


const getRecord = async (provider, service) => {

  return await ProviderHealth.findOne({
    provider,
    service
  }).lean();

};


const getAvailability = (record) => {

  if (!record) {
    return null;
  }

  const success =
    Number(record.successCount || 0);

  const failure =
    Number(record.failureCount || 0);

  const total = success + failure;

  if (total === 0) {
    return null;
  }

  return Math.round(
    (success / total) * 100
  );

};


const getGeneralStatus = (percentage) => {

  if (percentage === null) {
    return "unknown";
  }

  if (percentage >= 90) {
    return "operational";
  }

  if (percentage >= 60) {
    return "degraded";
  }

  return "unavailable";

};


const combineAvailability = (...records) => {

  let success = 0;
  let failure = 0;

  for (const record of records) {

    if (!record) {
      continue;
    }

    success += Number(
      record.successCount || 0
    );

    failure += Number(
      record.failureCount || 0
    );

  }

  const total = success + failure;

  if (total === 0) {
    return null;
  }

  return Math.round(
    (success / total) * 100
  );

};


const getNetworkStatus = async (req, res) => {

  try {

    /*
     * Airtime is intentionally presented
     * as one general AlphaBot service.
     *
     * Provider identities remain internal.
     */

    const blitzAirtime = await getRecord(
      "blitzpay",
      "/api-purchase"
    );

    const vtuAirtime = await getRecord(
      "VTU",
      "/api/v2/airtime"
    );


    const airtimeAvailability =
      combineAvailability(
        blitzAirtime,
        vtuAirtime
      );


    /*
     * Data plans are grouped by mobile network.
     * Provider information is never returned.
     */

    const dataPlanRecords =
      await ProviderHealth.find({
        provider: "oplug",
        service: {
          $in: NETWORKS.map(
            network => `data_plans:${network}`
          )
        }
      }).lean();


    const dataPlanMap = new Map(
      dataPlanRecords.map(record => [
        record.service,
        record
      ])
    );


    const dataPlans = {};


    for (const network of NETWORKS) {

      const record =
        dataPlanMap.get(
          `data_plans:${network}`
        );

      const availability =
        getAvailability(record);

      dataPlans[network] = {

        availability,

        status:
          getGeneralStatus(
            availability
          )

      };

    }


    return res.json({

      success: true,

      checkedAt: new Date(),

      airtime: {

        availability:
          airtimeAvailability,

        status:
          getGeneralStatus(
            airtimeAvailability
          )

      },

      dataPlans

    });


  } catch (error) {

    console.log(
      "Network status error:",
      error.message
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to retrieve current service availability"

    });

  }

};


module.exports = {
  getNetworkStatus
};
