const cron = require("node-cron");
const axios = require("axios");

const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");


async function findFlutterwaveTransaction(tx_ref){

  const response = await axios.get(
    "https://api.flutterwave.com/v3/transactions",
    {
      headers:{
        Authorization:`Bearer ${process.env.FLW_SECRET_KEY}`
      }
    }
  );

  return response.data.data.find(
    tx => tx.tx_ref === tx_ref
  );

}


function startFlutterwaveCron(){

  console.log("💰 Flutterwave fallback cron started");


  cron.schedule("*/2 * * * *", async()=>{

    try{

      console.log("🔄 Checking pending Flutterwave payments...");


      const pending = await Transaction.find({
        type:"fund",
        status:"pending",
        description:"Flutterwave wallet funding pending"
      });


      for(const payment of pending){

        try{

          const tx = await findFlutterwaveTransaction(
            payment.reference
          );


          if(!tx){
            continue;
          }


          if(tx.status !== "successful"){
            continue;
          }


          const alreadyCredited = await Transaction.findOne({
            reference: payment.reference,
            description:"Flutterwave Cron Funding"
          });


          if(alreadyCredited){

            payment.status="completed";
            await payment.save();

            continue;
          }


          let wallet = await Wallet.findOne({
            phone:payment.phone
          });


          if(!wallet){

            wallet = await Wallet.create({
              phone:payment.phone,
              balance:0
            });

          }


          const balanceBefore = wallet.balance;


          wallet.balance += Number(tx.amount);

          await wallet.save();


          const transaction = await Transaction.create({

            phone:payment.phone,

            type:"fund",

            direction:"credit",

            amount:Number(tx.amount),

            reference:payment.reference,

            flutterwaveId:String(tx.id),

            flutterwaveReference:tx.flw_ref,

            balanceBefore,

            balanceAfter:wallet.balance,

            description:"Flutterwave Cron Funding",

            status:"successful"

          });


          await createNotification(
            payment.phone,
            "Wallet Funded",
            `Your wallet has been funded successfully with ₦${Number(tx.amount).toLocaleString()}.`,
            "success",
            transaction._id
          );


          payment.status="completed";

          payment.flutterwaveId=String(tx.id);

          payment.flutterwaveReference=tx.flw_ref;

          await payment.save();


          console.log(
            `✅ Credited ${payment.phone} ${payment.reference}`
          );


        }catch(err){

          console.log(
            "Cron payment error:",
            err.message
          );

        }

      }


    }catch(err){

      console.log(
        "Flutterwave Cron Error:",
        err.message
      );

    }


  });

}


module.exports={
 startFlutterwaveCron
};
