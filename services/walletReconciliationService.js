const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");


async function reconcileWallets(){

  try{

    const wallets = await Wallet.find();


    let issues = 0;


    for(const wallet of wallets){


      const transactions = await Transaction.find({
        phone: wallet.phone,
        status:"successful"
      });


      let calculatedBalance = 0;


      for(const tx of transactions){

        if(tx.direction === "credit"){

          calculatedBalance += Number(tx.amount);

        }


        if(tx.direction === "debit"){

          calculatedBalance -= Number(tx.amount);

        }

      }


      if(
        Number(wallet.balance.toFixed(2)) !==
        Number(calculatedBalance.toFixed(2))
      ){

        issues++;


        console.log(
          "⚠️ Wallet mismatch:",
          wallet.phone,
          "Database:",
          wallet.balance,
          "Calculated:",
          calculatedBalance
        );

      }


    }


    console.log(
      `Wallet reconciliation completed. Issues found: ${issues}`
    );


  }catch(error){

    console.log(
      "Wallet reconciliation error:",
      error.message
    );

  }

}


module.exports = reconcileWallets;
