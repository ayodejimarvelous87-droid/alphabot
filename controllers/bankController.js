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

      return res.status(400).json({
        message: "Bank code and account number are required"
      });

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
