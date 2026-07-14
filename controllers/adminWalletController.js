const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");


// Search wallet
const searchWallet = async (req, res) => {
  try {

    const { phone } = req.params;

    const wallet = await Wallet.findOne({ phone });


    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
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


    const wallet = await Wallet.findOne({ phone });


    if(!wallet){
      return res.status(404).json({
        message:"Wallet not found"
      });
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

      description: reason || "Admin added funds"

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


const wallet = await Wallet.findOne({phone});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}



if(wallet.balance < Number(amount)){

return res.status(400).json({
message:"Insufficient balance"
});

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

description: reason || "Admin deducted funds"

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
