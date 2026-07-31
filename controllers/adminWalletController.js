const AppError = require("../utils/AppError");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");


// Search wallet
const searchWallet = async (req, res) => {
  try {

    const { phone } = req.params;

    const wallet = await Wallet.findOne({ phone });


    if (!wallet) {
      throw new AppError(
  "Wallet not found",
  404
);
    }


    res.json(wallet);


  } catch(error){

    res.status(500).json({
      message: error.message
    });

  }
};



// Add funds manually
const addFunds = async (req, res) => {
  try {

    const { phone, amount, reason } = req.body;


    if(!amount || Number(amount) <= 0){
      throw new AppError(
  "Invalid amount",
  400
);
    }


    const wallet = await Wallet.findOne({ phone });


    if(!wallet){
      throw new AppError(
  "Wallet not found",
  404
);
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

      description: reason || "Admin added funds",

      reference:"ADMIN_CREDIT_" + Date.now() + "_" + Math.random().toString(36).slice(2),

      adminId: req.user.id

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




// Deduct funds manually
const deductFunds = async (req,res)=>{

try{

const { phone, amount, reason } = req.body;


if(!amount || Number(amount) <= 0){
throw new AppError(
  "Invalid amount",
  400
);
}


const wallet = await Wallet.findOne({phone});


if(!wallet){

throw new AppError(
  "Wallet not found",
  404
);

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

description: reason || "Admin deducted funds",

reference:"ADMIN_DEBIT_" + Date.now() + "_" + Math.random().toString(36).slice(2),

adminId: req.user.id

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
