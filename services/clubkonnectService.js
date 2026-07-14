const axios = require("axios");
const vtuConfig = require("../config/vtu");


const checkBalance = async () => {

  try {

    const response = await axios.get(
      `${vtuConfig.apiUrl}/APIWalletBalanceV1.asp`,
      {
        params: {
          UserID: vtuConfig.userId,
          APIKey: vtuConfig.apiKey
        }
      }
    );


    console.log(response.data);

    return response.data;


  } catch (error) {

    console.log(
      "FULL ERROR:",
      error.response?.data || error.message
    );

  }

};


module.exports = {
  checkBalance
};
