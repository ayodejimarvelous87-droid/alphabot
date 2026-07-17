const axios = require("axios");
const vtuConfig = require("../config/vtu");


const buyData = async (
  phone,
  network,
  plan,
  requestId = Date.now()
) => {

  try {

    const response = await axios.get(
      `${vtuConfig.apiUrl}/APIDatabundleV1.asp`,
      {
        params: {
          UserID: vtuConfig.userId,
          APIKey: vtuConfig.dataKey,
          MobileNetwork: network,
          DataPlan: plan,
          MobileNumber: phone,
          RequestID: requestId
        }
      }
    );


    return response.data;


  } catch(error){

    console.log(
      "DATA ERROR:",
      error.response?.data || error.message
    );


    return {
      success:false,
      message:error.response?.data || error.message
    };

  }

};


module.exports = {
  buyData
};
