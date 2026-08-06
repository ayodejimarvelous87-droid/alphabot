const cron = require("node-cron");
const axios = require("axios");

const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const sendEmail = require("../services/emailService");
const { createNotification } = require("../services/notificationService");


async function findFlutterwaveTransaction(tx_ref){

  try{

    const response = await axios.get(
      "https://api.flutterwave.com/v3/transactions",
      {
        params:{
          tx_ref
        },
        headers:{
          Authorization:`Bearer ${process.env.FLW_SECRET_KEY}`
        }
      }
    );

    return response.data.data?.[0] || null;

  }catch(error){

    console.log(
      "Flutterwave lookup error:",
      error.response?.data || error.message
    );

    throw error;

  }

}


function startFlutterwaveCron(){

  console.log("💰 Flutterwave fallback cron started");


  cron.schedule("*/2 * * * *", async()=>{

    try{

      console.log("🔄 Checking pending Flutterwave payments...");


      const pending = await Transaction.find({
        type:"fund",
        status:{
          $in:["pending","successful"]
        },
        walletCredited:{
          $ne:true
        }
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
              
            if(payment.walletCredited === true){

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


          payment.flutterwaveId = String(tx.id);

          payment.flutterwaveReference = tx.flw_ref;

          payment.balanceBefore = balanceBefore;

          payment.balanceAfter = balanceBefore + Number(tx.amount);

          const transaction = payment;


          if(payment.walletCredited !== true){

            wallet.balance += Number(tx.amount);

            await wallet.save();

            payment.walletCredited = true;

          }

          payment.description = "Flutterwave wallet funding completed";

          payment.status = "successful";


          if(payment.notificationSent !== true){

            await createNotification(
              payment.phone,
              "Wallet Funded",
              `Your wallet has been funded successfully with ₦${Number(tx.amount).toLocaleString()}.`,
              "success",
              transaction._id
            );

            payment.notificationSent = true;

          }


          const user = await User.findOne({
            phone: payment.phone
          });


          if(user?.email && payment.emailSent !== true){

            await sendEmail(
              user.email,
              "Wallet Funded Successfully",
              `Your AlphaBot wallet has been funded successfully with ₦${Number(tx.amount).toLocaleString()}.`
            );

            payment.emailSent = true;

          }


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
