const TransactionPin = require("../models/TransactionPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const normalizePhone = require("../utils/phone");


// Fund wallet
const fundWallet = async (req, res) => {
  try {

    const { phone, amount } = req.body;

    const cleanPhone = normalizePhone(phone);


    if (req.user.phone !== cleanPhone) {
      return res.status(403).json({
        message: "Unauthorized wallet access"
      });
    }


    let wallet = await Wallet.findOne({
      phone: cleanPhone
    });

    const balanceBefore = wallet ? wallet.balance : 0;


    if (!wallet) {

      wallet = await Wallet.create({
        phone: cleanPhone,
        balance: Number(amount)
      });

    } else {

      wallet.balance += Number(amount);
      await wallet.save();

    }



    await Transaction.create({

      phone: cleanPhone,

      type:"fund",

      direction:"credit",

      amount:Number(amount),

      balanceBefore,

      balanceAfter: wallet.balance,

      description:"Wallet funding"

    });



    res.json({

      message:"Wallet funded successfully",

      wallet

    });



  } catch(error){

    res.status(500).json({

      message:error.message

    });

  }
};





// Check wallet balance
const checkBalance = async (req,res)=>{

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

      return res.status(404).json({

        message:"Wallet not found"

      });

    }


    res.json(wallet);



  }catch(error){

    res.status(500).json({

      message:error.message

    });

  }

};





// Transaction history
const transactionHistory = async(req,res)=>{

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

    res.status(500).json({

      message:error.message

    });

  }

};





// Pay using wallet with Transaction PIN
const payWallet = async(req,res)=>{

  try{


    const {
      phone,
      amount,
      description,
      pin
    } = req.body;



    const cleanPhone = normalizePhone(phone);



    if(req.user.phone !== cleanPhone){

      return res.status(403).json({

        message:"Unauthorized wallet access"

      });

    }




    const userPin = await TransactionPin.findOne({

      phone:cleanPhone

    });



    if(!userPin){

      return res.status(400).json({

        message:"Create transaction PIN first"

      });

    }




    if(userPin.pin !== pin){

      return res.status(400).json({

        message:"Incorrect transaction PIN"

      });

    }





    const wallet = await Wallet.findOne({

      phone:cleanPhone

    });



    if(!wallet){

      return res.status(404).json({

        message:"Wallet not found"

      });

    }




    if(wallet.balance < Number(amount)){

      return res.status(400).json({

        message:"Insufficient wallet balance"

      });

    }




    const balanceBefore = wallet.balance;

    wallet.balance -= Number(amount);


    await wallet.save();




    await Transaction.create({

      phone:cleanPhone,

      type:"purchase",

      direction:"debit",

      amount:Number(amount),

      balanceBefore,

      balanceAfter: wallet.balance,

      description:description || "VTU purchase"

    });




    res.json({

      message:"Payment successful",

      wallet

    });



  }catch(error){

    res.status(500).json({

      message:error.message

    });

  }

};





module.exports = {

fundWallet,

checkBalance,

transactionHistory,

payWallet

};
