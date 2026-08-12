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
      availability:null,
      status:"unknown"
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


    const airtime =
      await getAvailability({
        type:"airtime"
      });


    const dataPlans = {};


    for(const network of NETWORKS){

      dataPlans[network] =
        await getAvailability({
          type:"data",
          network
        });

    }


    return res.json({

      success:true,

      checkedAt:new Date(),

      airtime,

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
