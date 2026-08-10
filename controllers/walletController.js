const AppError = require("../utils/AppError");
const auditLogger = require("../services/auditLogger");
const bcrypt = require("bcryptjs");
const TransactionPin = require("../models/TransactionPin");
const {
  verifyTransactionAuthorization
} = require("../utils/transactionAuthorization");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const normalizePhone = require("../utils/phone");


// Fund wallet
const fundWallet = async (req, res) => {

  return res.status(410).json({

    success:false,

    message:
      "Wallet direct funding has been retired. Use Manual Funding Request or Flutterwave."

  });

};


// Check wallet balance
const checkBalance = async (req,res,next)=>{

  try{

    const cleanPhone = normalizePhone(req.params.phone);


    if(req.user.role !== "admin" && req.user.phone !== cleanPhone){

      return res.status(403).json({

        message:"Unauthorized wallet access"

      });

    }


    const wallet = await Wallet.findOne({

      phone:cleanPhone

    });


    if(!wallet){

      throw new AppError("Wallet not found", 404);

    }


    res.json(wallet);



  }catch(error){

    next(error);

  }

};





// Transaction history
const transactionHistory = async(req,res,next)=>{

  try{


    const cleanPhone = normalizePhone(req.params.phone);



    if(req.user.role !== "admin" && req.user.phone !== cleanPhone){

      return res.status(403).json({

        message:"Unauthorized wallet access"

      });

    }



    const transactions = await Transaction.find({

      phone:cleanPhone

    }).sort({

      createdAt:-1

    });



    res.json(transactions);



  }catch(error){

    next(error);

  }

};





// Pay using wallet with Transaction PIN
const payWallet = async(req,res,next)=>{

  try{


    const {
      phone,
      amount,
      description,
      pin,
      biometricToken,
      idempotencyKey
    } = req.body;


    if(!idempotencyKey){
      throw new AppError("Idempotency key required",400);
    }


    if(!amount || Number(amount) <= 0 || isNaN(Number(amount))){
      throw new AppError("Invalid payment amount",400);
    }

    if(idempotencyKey){

      const existingTransaction = await Transaction.findOne({
        idempotencyKey
      });

      if(existingTransaction){
        throw new AppError(
          "Duplicate payment request",
          400
        );
      }

    }


    const cleanPhone = normalizePhone(phone);



    if(req.user.phone !== cleanPhone){

      return res.status(403).json({

        message:"Unauthorized wallet access"

      });

    }




    const authorized =
      await verifyTransactionAuthorization({
        phone: cleanPhone,
        pin,
        biometricToken
      });

    if(!authorized){

      throw new AppError(
        biometricToken
          ? "Fingerprint authorization expired or invalid"
          : "Incorrect transaction PIN",
        400
      );

    }





      const walletBefore = await Wallet.findOne({
        phone:cleanPhone
      });

      if(!walletBefore){
        throw new AppError("Wallet not found", 404);
      }

      const balanceBefore = walletBefore.balance;

      const wallet = await Wallet.findOneAndUpdate(
        {
          phone:cleanPhone,
          balance:{
            $gte:Number(amount)
          }
        },
        {
          $inc:{
            balance:-Number(amount)
          }
        },
        {
          new:true
        }
      );

      if(!wallet){
        throw new AppError("Insufficient wallet balance", 400);
      }




    await Transaction.create({

      phone:cleanPhone,

      type:"purchase",

      direction:"debit",

      amount:Number(amount),

      idempotencyKey,

      balanceBefore,

      balanceAfter: wallet.balance,

      description:description || "VTU purchase"

    });




    res.json({

      message:"Payment successful",

      wallet

    });



  }catch(error){

    next(error);

  }

};





module.exports = {

fundWallet,

checkBalance,

transactionHistory,

payWallet

};