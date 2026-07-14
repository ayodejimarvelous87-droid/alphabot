const axios = require("axios");
const vtuConfig = require("../config/vtu");
const { getToken } = require("./vtuAuthService");


const vtuRequest = async (method, endpoint, data = null) => {

  try {

    if (!vtuConfig.token) {
      await getToken();
    }


    const response = await axios({
      method,
      url: `${vtuConfig.apiUrl}${endpoint}`,
      data,
      headers: {
        Authorization: `Bearer ${vtuConfig.token}`,
        "Content-Type": "application/json"
      }
    });


    return response.data;


  } catch (error) {


    // Token expired, get new one and retry once
    if (
      error.response?.status === 403
    ) {

      await getToken();


      const retry = await axios({
        method,
        url: `${vtuConfig.apiUrl}${endpoint}`,
        data,
        headers: {
          Authorization: `Bearer ${vtuConfig.token}`,
          "Content-Type": "application/json"
        }
      });


      return retry.data;

    }


    throw error;

  }

};


module.exports = {
  vtuRequest
};
