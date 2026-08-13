const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const TransactionPin = require("../models/TransactionPin");
const TVSubscription = require("../models/TVSubscription");
const Wallet = require("../models/wallet");
const TVPlan = require("../models/TVPlan");
const Transaction = require("../models/Transaction");
const Profit = require("../models/Profit");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");

const {
  verifyCustomer,
  purchaseTV
} = require("../services/vtuService");
const { purchase, getCablePackages } = require("../services/blitzPayService");
const { checkIdempotency } = require("../utils/idempotency");
const { checkFraudLimits } = require("../services/fraudDetectionService");
const { addBlogCommission } = require("../services/blogCommissionService");


const subscribeTV = async (req, res) => {

  try {

    const {
      provider,
      smartCardNumber,
      variation_id,
        vtu_variation_id,
      amount,
      pin
    } = req.body;

      const idempotencyKey =
      req.headers["idempotency-key"];


      const existingTransaction =
      await checkIdempotency(idempotencyKey);


      if(existingTransaction){

        return res.json({
          message:"Transaction already processed",
          transaction:existingTransaction
        });

      }




    const phone = normalizePhone(req.user.phone);


    if (!provider || !smartCardNumber || !variation_id || !amount || !pin) {

      throw new AppError("Provider, smart card, package, amount and PIN required", 400);

    }


    const userPin = await TransactionPin.findOne({
      phone
    });


    if (!userPin) {

      throw new AppError("Create transaction PIN first", 400);

    }


    if (!(await bcrypt.compare(pin,userPin.pin))) {

      throw new AppError("Incorrect transaction PIN", 400);

    }


    const wallet = await Wallet.findOne({
      phone
    });


    if (!wallet) {

      throw new AppError("Wallet not found", 404);

    }


    const tvPlan = await TVPlan.findOne({
      variation_id
    });


    if (!tvPlan){

      throw new AppError("TV plan not found", 404);

    }


    if(!tvPlan.active){

      throw new AppError("This TV plan is currently unavailable", 400);

    }


    const chargeAmount = Number(tvPlan.sellingPrice);


    await checkFraudLimits({

      phone,

      amount:Number(chargeAmount),

      type:"tv",

      ip:req.ip,

      userAgent:req.headers["user-agent"]

    });


    if (wallet.balance < chargeAmount) {

      throw new AppError("Insufficient wallet balance", 400);

    }


    const verify = await verifyCustomer({

      customer_id: smartCardNumber,

      service_id: provider

    });


    if (!verify || verify.code !== "success") {

      throw new AppError("Smart card verification failed", 400);

    }


    const reference = "TV-" + phone + "-" + Date.now();


    const balanceBefore = wallet.balance;


    // Debit wallet first
    wallet.balance -= chargeAmount;

    await wallet.save();


    let providerResponse;


      try {

        try {

            const packageCode = variation_id;

          providerResponse = await purchase({

            type: "cable",

            provider_code: provider,

            smartcard: smartCardNumber,

            package_code: packageCode,

            amount: Number(tvPlan.providerPrice || chargeAmount)

          });

        } catch (blitzError) {

          console.log("BlitzPay failed, using VTU backup");

          providerResponse = await purchaseTV({

            customer_id: smartCardNumber,

            service_id: provider,

              variation_id: vtu_variation_id || variation_id,

            request_id: reference

          });

        }

        if(
!providerResponse ||
providerResponse.success !== true ||
providerResponse.status !== "success"
){

          throw new Error("TV provider failed");

        }


    } catch (err) {


      // Refund wallet if VTU fails

      wallet.balance += chargeAmount;

      await wallet.save();


      await Transaction.create({

        phone,

        type: "refund",

        direction: "credit",

        amount: chargeAmount,

        reference,

        idempotencyKey,

        originalReference:reference,

        service:"tv",

        balanceBefore: wallet.balance - chargeAmount,

        balanceAfter: wallet.balance,

        description: "Automatic refund - TV failed",

        status: "successful"

      });


      throw new AppError("TV subscription failed", 400);

    }



    const subscription = await TVSubscription.create({

      phone,

      provider,

      smartCardNumber,

      package: variation_id,
        vtu_variation_id,

      amount: chargeAmount,

      reference,

      status: "successful"

    });


    const providerCost =
      Number(tvPlan.providerPrice || chargeAmount);


    const profit =
      Number(chargeAmount) - providerCost;


    await Profit.create({

      service:"tv",

      customerAmount:Number(chargeAmount),

      providerCost,

      profit,

      source:provider,

      reference,

      phone

    });



    await Transaction.create({

      phone,

      type: "tv",

      direction: "debit",

      amount: chargeAmount,

      reference,

      vtuRequestId:
        providerResponse?.reference ||
        providerResponse?.request_id ||
        reference,

      vtuOrderId:
        providerResponse?.data?.order ||
        providerResponse?.order_id ||
        null,

      providerResponse: providerResponse,

      balanceBefore,

      balanceAfter: wallet.balance,

      description: `${provider} TV subscription`,

      status: "successful"

    });


    await addBlogCommission({
      phone,
      amount:Number(chargeAmount),
      reference,
      service:"tv"
    });



    await createNotification(

      phone,

      "TV Subscription Successful",

      `${provider} subscription completed.`,

      "success"

    );



    res.json({

      message: "TV subscription successful",

      subscription,

      balance: wallet.balance,

      providerResponse

    });



  } catch (error) {


    console.log(
      "TV error:",
      error.response?.data || error.message
    );


    res.status(500).json({

      message: error.response?.data || error.message

    });


  }

};



const getTVPlans = async (req, res) => {

  try {

    const plans = await TVPlan.find({
      active: true
    })
    .sort({
      provider: 1,
      sellingPrice: 1
    })
    .lean();

    res.json({
      success: true,
      plans
    });

  } catch (error) {

    console.log(
      "TV Plans error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch TV plans"
    });

  }
};


module.exports = {
  subscribeTV, getTVPlans
};
