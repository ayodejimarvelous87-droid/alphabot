const Transaction = require("../models/Transaction");

const NETWORKS = [
  "MTN",
  "AIRTEL",
  "GLO",
  "9MOBILE"
];

const getAvailability = async (query) => {

  const transactions = await Transaction.find({
    ...query,
    status:{
      $in:[
        "successful",
        "failed"
      ]
    }
  })
  .sort({
    createdAt:-1
  })
  .limit(20)
  .lean();

  const total = transactions.length;

  if(total === 0){
    return {
      availability:100,
      status:"operational"
    };
  }

  const successful = transactions.filter(
    transaction =>
      transaction.status === "successful"
  ).length;

  const availability =
    Math.round(
      (successful / total) * 100
    );

  let status;

  if(availability >= 90){
    status = "operational";
  }
  else if(availability >= 50){
    status = "degraded";
  }
  else{
    status = "unavailable";
  }

  return {
    availability,
    status
  };

};


const getTransactionNetwork = (transaction) => {

  // New transactions store network directly.
  if(transaction.network){
    return String(transaction.network).toUpperCase();
  }

  // Older airtime transactions may have the network
  // inside the provider response.
  if(transaction.providerResponse?.data?.service_name){
    return String(
      transaction.providerResponse.data.service_name
    ).toUpperCase();
  }

  // Older data transactions store the network
  // in the transaction description.
  if(transaction.description){

    const match =
      String(transaction.description).match(
        /^(MTN|AIRTEL|GLO|9MOBILE)\b/i
      );

    if(match){
      return match[1].toUpperCase();
    }

  }

  return null;

};


const getNetworkAvailability = async (type, network) => {

  const transactions = await Transaction.find({
    type,
    status:{
      $in:[
        "successful",
        "failed"
      ]
    }
  })
  .sort({
    createdAt:-1
  })
  .limit(100)
  .lean();

  const networkTransactions =
    transactions.filter(
      transaction =>
        getTransactionNetwork(transaction) === network
    )
    .slice(0,20);

  const total = networkTransactions.length;

  if(total === 0){
    return {
      availability:100,
      status:"operational"
    };
  }

  const successful =
    networkTransactions.filter(transaction => {

      // Transaction itself must be successful.
      if(transaction.status !== "successful"){
        return false;
      }

      const provider =
        transaction.providerResponse;

      // VTU-style failed response.
      if(provider?.status === "error"){
        return false;
      }

      // Generic failed provider responses.
      if(
        provider?.success === false ||
        provider?.code === "error" ||
        provider?.status === "failed" ||
        provider?.Status === "failed"
      ){
        return false;
      }

      return true;

    }).length;

  const availability =
    Math.round(
      (successful / total) * 100
    );

  let status;

  if(availability >= 90){
    status = "operational";
  }
  else if(availability >= 50){
    status = "degraded";
  }
  else{
    status = "unavailable";
  }

  return {
    availability,
    status
  };

};


const getNetworkStatus = async (req, res) => {

  try {

    /*
     * PUBLIC NETWORK STATUS
     *
     * Based only on the latest 20 real purchase
     * attempts.
     *
     * Provider names and ProviderHealth are intentionally
     * not exposed here.
     */


    const airtimePlans = {};
    const dataPlans = {};


    for(const network of NETWORKS){

      airtimePlans[network] =
        await getNetworkAvailability(
          "airtime",
          network
        );

      dataPlans[network] =
        await getNetworkAvailability(
          "data",
          network
        );

    }


    return res.json({

      success:true,

      checkedAt:new Date(),

      airtimePlans,

      dataPlans

    });


  } catch(error){

    console.log(
      "Network status error:",
      error.message
    );


    return res.status(500).json({

      success:false,

      message:
        "Unable to retrieve network status"

    });

  }

};


module.exports = {
  getNetworkStatus
};
