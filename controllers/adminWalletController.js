const AppError = require("../utils/AppError");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");

const MAX_ADMIN_WALLET_ADJUSTMENT = 500000;


// Search wallet
const searchWallet = async (req, res) => {
  try {

    const { phone } = req.params;

    const wallet = await Wallet.findOne({ phone });

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    res.json(wallet);

  } catch(error) {

    res.status(500).json({
      message:error.message
    });

  }
};


// Add funds
const addFunds = async (req, res) => {
  try {

    const { phone, amount } = req.body;

    if(!amount || Number(amount) <= 0){
      throw new AppError("Invalid amount",400);
    }

    if(Number(amount) > MAX_ADMIN_WALLET_ADJUSTMENT){
      throw new AppError(
        "Admin wallet adjustment limit exceeded",
        400
      );
    }

    const wallet = await Wallet.findOne({phone});

    if(!wallet){
      throw new AppError("Wallet not found",404);
    }

    const balanceBefore = wallet.balance;

    wallet.balance += Number(amount);

    await wallet.save();


    await Transaction.create({

      phone,

      type:"admin_credit",

      direction:"credit",

      amount:Number(amount),

      balanceBefore,

      balanceAfter:wallet.balance,

      description:"Admin added funds",

      reference:
      "ADMIN_CREDIT_" + Date.now(),

      adminId:req.user.id

    });


    res.json({
      message:"Funds added successfully",
      wallet
    });


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};



// Deduct funds
const deductFunds = async (req,res)=>{
  try{

    const { phone, amount } = req.body;


    if(!amount || Number(amount)<=0){
      throw new AppError("Invalid amount",400);
    }


    if(Number(amount)>MAX_ADMIN_WALLET_ADJUSTMENT){
      throw new AppError(
        "Admin wallet adjustment limit exceeded",
        400
      );
    }


    const wallet = await Wallet.findOne({phone});


    if(!wallet){
      throw new AppError("Wallet not found",404);
    }


    if(wallet.balance < Number(amount)){
      throw new AppError(
        "Insufficient balance",
        400
      );
    }


    const balanceBefore = wallet.balance;


    wallet.balance -= Number(amount);

    await wallet.save();


    await Transaction.create({

      phone,

      type:"admin_debit",

      direction:"debit",

      amount:Number(amount),

      balanceBefore,

      balanceAfter:wallet.balance,

      description:"Admin deducted funds",

      reference:
      "ADMIN_DEBIT_" + Date.now(),

      adminId:req.user.id

    });


    res.json({
      message:"Funds deducted successfully",
      wallet
    });


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};



module.exports = {
  searchWallet,
  addFunds,
  deductFunds
};
