const Recurring = require("../models/Recurring");
const Wallet = require("../models/wallet");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const { checkFraudLimits } = require("./fraudDetectionService");

const { purchaseProduct } = require("./vtuService");


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

      if (!wallet) continue;


      if (wallet.balance < payment.amount) {
        console.log(
          "Insufficient balance:",
          payment.phone
        );
        continue;
      }


      const product = await Product.findById(
        payment.productId
      );


      if (!product) continue;


      if(
        product.type !== "airtime" &&
        product.type !== "data"
      ){
        continue;
      }


      await checkFraudLimits({

        phone: payment.phone,

        amount: payment.amount,

        type:"recurring"

      });


      const result = await purchaseProduct(
        payment.phone,
        product
      );


      if(!result.success){
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
