const axios = require("axios");
const vtuConfig = require("../config/vtu");


const buyAirtime = async (phone, network, amount) => {

  try {

    const response = await axios.get(
      `${vtuConfig.apiUrl}/APIAirtimeV1.asp`,
      {
        params: {
          UserID: vtuConfig.userId,
          APIKey: vtuConfig.apiKey,
          MobileNetwork: network,
          Amount: amount,
          MobileNumber: phone
        }
      }
    );


    return response.data;


  } catch (error) {

    return {
      success: false,
      message: error.response?.data || error.message
    };

  }

};


module.exports = {
  buyAirtime
};
