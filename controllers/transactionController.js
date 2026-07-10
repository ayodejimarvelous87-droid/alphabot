const Transaction = require("../models/Transaction");


// Get transaction history
const getTransactions = async (req, res) => {
  try {

    const { phone } = req.params;


    if (req.user.phone !== phone) {
      return res.status(403).json({
        message: "Unauthorized transaction access"
      });
    }


    const transactions = await Transaction.find({ phone })
      .sort({ createdAt: -1 });


    res.json(transactions);


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


module.exports = {
  getTransactions
};
