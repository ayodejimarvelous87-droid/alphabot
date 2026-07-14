const axios = require("axios");
const vtuConfig = require("../config/vtu");


const getToken = async () => {

  try {

    const response = await axios.post(
      `${vtuConfig.apiUrl}/jwt-auth/v1/token`,
      {
        username: vtuConfig.username,
        password: vtuConfig.password
      }
    );


    vtuConfig.token = response.data.token;


    console.log("VTU token obtained successfully");


    return vtuConfig.token;


  } catch (error) {

    console.log(
      "VTU authentication error:",
      error.response?.data || error.message
    );


    return null;

  }

};


module.exports = {
  getToken
};
