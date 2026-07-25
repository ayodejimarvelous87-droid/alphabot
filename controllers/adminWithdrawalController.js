const Withdrawal = require("../models/Withdrawal");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");


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


    if(withdrawal.status !== "pending"){
      return res.status(400).json({
        message:"Withdrawal already processed"
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


    await Notification.create({
      phone:withdrawal.phone,
      title:"Withdrawal Approved",
      message:`Your withdrawal of ₦${withdrawal.amount} has been approved.`,
      type:"success"
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


    if(withdrawal.status !== "pending"){
      return res.status(400).json({
        message:"Withdrawal already processed"
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

    await Notification.create({
      phone:withdrawal.phone,
      title:"Withdrawal Rejected",
      message:`Your withdrawal of ₦${withdrawal.amount} was rejected. The amount has been refunded to your wallet.`,
      type:"warning"
    });

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
