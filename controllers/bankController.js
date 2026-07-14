const BankSettings = require("../models/BankSettings");


// Get bank details
const getBankDetails = async (req, res) => {
  try {

    const bank = await BankSettings.findOne();

    if (!bank) {
      return res.status(404).json({
        message: "Bank details not found"
      });
    }


    res.json(bank);


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



// Add or update bank details
const updateBankDetails = async (req, res) => {
  try {

    const {
      bankName,
      accountNumber,
      accountName,
      instructions
    } = req.body;


    let bank = await BankSettings.findOne();


    if (bank) {

      bank.bankName = bankName;
      bank.accountNumber = accountNumber;
      bank.accountName = accountName;
      bank.instructions = instructions;

    } else {

      bank = await BankSettings.create({
        bankName,
        accountNumber,
        accountName,
        instructions
      });

    }


    await bank.save();


    res.json({
      message: "Bank details updated",
      bank
    });


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



module.exports = {
  getBankDetails,
  updateBankDetails
};
