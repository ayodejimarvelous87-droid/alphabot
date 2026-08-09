const Recurring = require("../models/Recurring");
const Wallet = require("../models/wallet");
const Product = require("../models/Product");
const ProductOverride = require("../models/ProductOverride");
const Transaction = require("../models/Transaction");
const { checkFraudLimits } = require("./fraudDetectionService");

const { purchaseProduct } = require("./vtuService");
const { purchase } = require("./blitzPayService");
const { purchaseData } = require("./oplugService");


const processRecurringPayments = async () => {

  try {

    const now = new Date();

    const payments = await Recurring.find({
      status: "active",
      processing:false,
      nextRun: {
        $lte: now
      }
    });


    for (const payment of payments) {

      payment.processing = true;
      await payment.save();

      const wallet = await Wallet.findOne({
        phone: payment.phone
      });

      if (!wallet) {
        payment.processing = false;
        await payment.save();
        continue;
      }


      // ======================================================
      // DATA RECURRING
      // ======================================================

      if(payment.service === "data"){

        const dataPrice = await ProductOverride.findOne({
          productId:String(payment.variationId)
        });

        if(!dataPrice || dataPrice.active === false){

          console.log(
            "Recurring data plan unavailable:",
            payment.variationId
          );

          payment.processing = false;
          await payment.save();
          continue;
        }


        const customerAmount =
          Number(dataPrice.sellingPrice);

        if(customerAmount <= 0){

          console.log(
            "Invalid recurring data price:",
            payment.variationId
          );

          payment.processing = false;
          await payment.save();
          continue;
        }


        // IMPORTANT:
        // Always use the CURRENT ProductOverride price.
        // Provider price/plan changes are therefore picked up
        // automatically on the next recurring run.
        payment.amount = customerAmount;

        if(wallet.balance < customerAmount){

          console.log(
            "Insufficient balance:",
            payment.phone
          );

          payment.processing = false;
          await payment.save();
          continue;
        }


        await checkFraudLimits({

          phone:payment.phone,

          amount:customerAmount,

          type:"recurring"

        });


        let providerResponse;

        try{

          const network =
            dataPrice.network ||
            payment.network;

          const variationId =
            String(
              dataPrice.providerPlanId ||
              payment.variationId
            );

          const targetPhone =
            payment.targetPhone ||
            payment.phone;


          if(payment.provider === "blitzpay"){

            providerResponse = await purchase({

              type:"data",

              network,

              phone:targetPhone,

              package_id:variationId,

              amount:Number(dataPrice.providerPrice)

            });

            if(
              !providerResponse ||
              providerResponse.success !== true
            ){
              throw new Error(
                providerResponse?.error ||
                providerResponse?.message ||
                "BlitzPay recurring data purchase failed"
              );
            }

          }else if(payment.provider === "oplug"){

            providerResponse = await purchaseData({

              network,

              planId:variationId,

              phone:targetPhone

            });

            if(
              !providerResponse ||
              providerResponse.status === "fail" ||
              providerResponse.Status === "failed"
            ){
              throw new Error(
                providerResponse?.message ||
                providerResponse?.error ||
                providerResponse?.msg ||
                "OPLUG recurring data purchase failed"
              );
            }

          }else{

            providerResponse = await purchaseProduct(

              targetPhone,

              {
                variation_id:variationId,
                network
              }

            );

            if(
              !providerResponse ||
              providerResponse.code !== "success"
            ){
              throw new Error(
                providerResponse?.message?.message ||
                providerResponse?.message ||
                providerResponse?.error ||
                "VTU recurring data purchase failed"
              );
            }

          }


          const balanceBefore = wallet.balance;

          wallet.balance -= customerAmount;

          await wallet.save();


          await Transaction.create({

            phone:payment.phone,

            type:"recurring",

            direction:"debit",

            amount:customerAmount,

            balanceBefore,

            balanceAfter:wallet.balance,

            description:
              `Recurring ${payment.network || dataPrice.network || ""} ${payment.planName || "data"} payment`,

            reference:payment._id.toString(),

            status:"successful"

          });


          if(payment.frequency === "daily"){
            payment.nextRun.setDate(
              payment.nextRun.getDate()+1
            );
          }


          if(payment.frequency === "weekly"){
            payment.nextRun.setDate(
              payment.nextRun.getDate()+7
            );
          }


          if(payment.frequency === "monthly"){
            payment.nextRun.setMonth(
              payment.nextRun.getMonth()+1
            );
          }


          payment.processing = false;

          await payment.save();


          console.log(
            "Recurring data completed:",
            payment.phone,
            payment.network,
            payment.planName
          );

          continue;

        }catch(error){

          console.log(
            "Recurring data error:",
            error.message
          );

          payment.processing = false;

          await payment.save();

          continue;

        }

      }


      // ======================================================
      // AIRTIME RECURRING
      // Existing Product-based behaviour remains unchanged.
      // ======================================================

      if (wallet.balance < payment.amount) {

        console.log(
          "Insufficient balance:",
          payment.phone
        );

        payment.processing = false;
        await payment.save();

        continue;
      }


      const product = await Product.findById(
        payment.productId
      );


      if (!product) {

        payment.processing = false;
        await payment.save();

        continue;
      }


      if(product.type !== "airtime"){

        payment.processing = false;
        await payment.save();

        continue;
      }


      await checkFraudLimits({

        phone:payment.phone,

        amount:payment.amount,

        type:"recurring"

      });


      const result = await purchaseProduct(
        payment.phone,
        product
      );


      if(!result.success){

        payment.processing = false;
        await payment.save();

        continue;
      }


      const balanceBefore = wallet.balance;

      wallet.balance -= payment.amount;

      await wallet.save();


      await Transaction.create({

        phone: payment.phone,

        type:"recurring",

        direction:"debit",

        amount:payment.amount,

        balanceBefore,

        balanceAfter:wallet.balance,

        description:`Recurring ${product.name} payment`,

        reference:payment._id.toString(),

        status:"successful"

      });


      if(payment.frequency === "daily"){
        payment.nextRun.setDate(
          payment.nextRun.getDate()+1
        );
      }


      if(payment.frequency === "weekly"){
        payment.nextRun.setDate(
          payment.nextRun.getDate()+7
        );
      }


      if(payment.frequency === "monthly"){
        payment.nextRun.setMonth(
          payment.nextRun.getMonth()+1
        );
      }


      payment.processing = false;

      await payment.save();


      console.log(
        "Recurring completed:",
        payment.phone
      );

    }


  } catch(error){

    console.log(
      "Recurring error:",
      error.message
    );

  }

};


module.exports = {
  processRecurringPayments
};
