const Withdrawal = require("../models/Withdrawal");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");


// Get all withdrawals for admin
const getWithdrawals = async (req,res)=>{
  try {

    const withdrawals = await Withdrawal.find()
      .sort({
        createdAt:-1
      });

    res.json(withdrawals);


  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};



const approveWithdrawal = async (req,res)=>{
  try {

    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id);

    if(!withdrawal){
      return res.status(404).json({
        message:"Withdrawal not found"
      });
    }


    withdrawal.status = "successful";

    await withdrawal.save();


    await Transaction.create({
      phone: withdrawal.phone,
      type:"withdrawal",
      direction:"debit",
      amount: withdrawal.amount,
      reference: withdrawal.reference,
      description:"Withdrawal approved",
      status:"successful"
    });


    res.json({
      message:"Withdrawal approved"
    });


  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};



const rejectWithdrawal = async (req,res)=>{
  try {

    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id);


    if(!withdrawal){
      return res.status(404).json({
        message:"Withdrawal not found"
      });
    }


    const wallet = await Wallet.findOne({
      phone: withdrawal.phone
    });


    if(wallet){

      wallet.balance += withdrawal.amount;

      await wallet.save();

    }


    withdrawal.status = "failed";

    await withdrawal.save();


    res.json({
      message:"Withdrawal rejected and refunded"
    });


  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};



module.exports = {
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
};
