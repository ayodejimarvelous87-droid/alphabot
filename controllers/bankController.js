const AppError = require("../utils/AppError");
const axios = require("axios");

const getBanks = async (req, res) => {
  try {

    const response = await axios.get(
      "https://api.flutterwave.com/v3/banks/NG",
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
        }
      }
    );

    console.log("BANK VERIFY RESPONSE:", response.data);

    res.json(response.data);

  } catch (error) {

    res.status(500).json({
      message:
        error.response?.data || error.message
    });

  }
};

const verifyAccount = async (req, res) => {

  try {

    const {
      accountNumber,
      bankCode
    } = req.body;

    if (!accountNumber || !bankCode) {

      throw new AppError(
  "Bank code and account number are required",
  400
);

    }

    const response = await axios.post(

      "https://api.flutterwave.com/v3/accounts/resolve",

      {
        account_number: accountNumber,
        account_bank: bankCode
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }

    );

    console.log("BANK VERIFY RESPONSE:", response.data);

    res.json(response.data);

  } catch (error) {

    res.status(500).json({
      message:
        error.response?.data || error.message
    });

  }

};

module.exports = {
  getBanks,
  verifyAccount
};
