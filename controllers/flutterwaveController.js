const AppError = require("../utils/AppError");
const Flutterwave = require("flutterwave-node-v3");
const Wallet = require("../models/wallet");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const normalizePhone = require("../utils/phone");
const axios = require("axios");
const { recordProviderResult } = require("../services/providerMonitorService");
const { createNotification } = require("../services/notificationService");

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const createPayment = async (req, res) => {
  try {

    console.log("FLW USER:", req.user);
    console.log("FLW KEY EXISTS:", !!process.env.FLW_SECRET_KEY);

    const { amount } = req.body;

    const user = await User.findById(req.user.id);

    if(!user){
      throw new AppError("User not found", 404);
    }

    const phone = normalizePhone(user.phone);

    if (!amount || Number(amount) <= 0) {
      throw new AppError("Invalid amount", 400);
    }

    const payload = {

      tx_ref: "ALPHABOT-" + Date.now(),

      amount: Number(amount),

      currency: "NGN",

      redirect_url:
      "https://alphabot-frontend-chi.vercel.app/payment/result",

      customer: {
        email: user.email,
        phonenumber: phone,
        name: user.name || "AlphaBot User"
      },

      meta: {
        phone: phone
      },

      customizations: {
        title: "AlphaBot Wallet Funding",
        description: "Fund your AlphaBot wallet"
      }

    };

    const response =
      await axios.post(
        "https://api.flutterwave.com/v3/payments",
        payload,
        {
          headers:{
            Authorization:`Bearer ${process.env.FLW_SECRET_KEY}`,
            "Content-Type":"application/json"
          }
        }
      )


    await Transaction.create({
      phone: phone,
      type: "fund",
      direction: "credit",
      amount: Number(amount),
      reference: payload.tx_ref,
      status: "pending",
      description: "Flutterwave wallet funding pending"
    });

    console.log("FLW SUCCESS:", response.data);

    res.json(response.data);


  } catch(error) {

    console.log(
      "FLW ERROR:",
      error.response?.data || error.message
    );

    next(error);

  }
};



const verifyPayment = async (req,res,next)=>{

  try {

    const { transaction_id } = req.params;

    const response =
      await flw.Transaction.verify({
        id: transaction_id
      });


    if (
      response.status !== "success" ||
      response.data.status !== "successful"
    ){

      throw new AppError("Payment verification failed", 400);

    }


    const txRef = response.data.tx_ref;

      const alreadyProcessed = await Transaction.findOne({
        flutterwaveId: String(response.data.id),
        status:"successful"
      });


      if(alreadyProcessed){

        return res.json({
          message:"Payment already processed"
        });

      }




    const pending = await Transaction.findOne({
      reference: txRef,
      status:"pending"
    });


    if(!pending){

      const existing = await Transaction.findOne({
        reference: txRef,
        type:"fund",
        status:"successful"
      });


      if(existing){

        return res.json({
          message:"Payment already verified"
        });

      }


      throw new AppError("Pending payment not found", 404);

    }


    let wallet = await Wallet.findOne({
      phone: pending.phone
    });


    if(!wallet){

      wallet = await Wallet.create({
        phone: pending.phone,
        balance:0
      });

    }


// Flutterwave integrity checks

if(response.data.currency !== "NGN"){

throw new AppError("Invalid payment currency", 400);

}


if(Number(response.data.amount) !== Number(pending.amount)){

throw new AppError("Payment amount mismatch", 400);

}


if(response.data.tx_ref !== pending.reference){

throw new AppError("Payment reference mismatch", 400);

}


if(
response.data.meta?.phone &&
response.data.meta.phone !== pending.phone
){

throw new AppError("Payment owner mismatch", 400);

}
    const balanceBefore = wallet.balance;

    wallet.balance += Number(response.data.amount);

    await wallet.save();


    const transaction = await Transaction.create({

      phone: pending.phone,

      type:"fund",

      direction:"credit",

      amount:Number(response.data.amount),

      reference:txRef,

      flutterwaveId:String(response.data.id),

      flutterwaveReference:response.data.flw_ref,

      balanceBefore,

      balanceAfter:wallet.balance,

      description:"Flutterwave wallet funding",

      status:"successful"

    });


    await createNotification(
      pending.phone,
      "Wallet Funded",
      `Your wallet has been funded successfully with ₦${Number(response.data.amount).toLocaleString()}.`,
      "success",
      transaction._id
    );


    pending.status = "successful";

    pending.flutterwaveId = String(response.data.id);

    pending.flutterwaveReference = response.data.flw_ref;

    await pending.save();


    res.json({

      message:"Wallet funded successfully",

      wallet

    });


  }catch(error){

    console.log(
      "VERIFY ERROR:",
      error.message
    );

    next(error);

  }

};


// Flutterwave webhook
const flutterwaveWebhook = async (req, res) => {

  try {

    const hash = req.headers["verif-hash"];

    if (!hash || hash !== process.env.FLW_WEBHOOK_SECRET) {
      return res.status(401).json({
        message: "Invalid webhook signature"
      });
    }

    console.log("🔥 FLUTTERWAVE HIT WEBHOOK");
    const data = req.body;
    console.log("FLW WEBHOOK RECEIVED:", JSON.stringify(data));

    const event = data.event;

    if (event === "charge.failed") {

        const failedExists = await Transaction.findOne({
          reference: data.data.tx_ref,
          status: "failed"
        });

        if (failedExists) {
          return res.status(200).json({
            message: "Already recorded"
          });
        }

      await Transaction.create({
        phone: data.data.customer?.phonenumber || "unknown",
        type: "fund",
        direction: "credit",
        amount: Number(data.data.amount || 0),
        reference: data.data.tx_ref,
        description: "Flutterwave failed payment",
        status: "failed"
      });

      return res.status(200).json({
        message: "Failed payment recorded"
      });

    }

    if (event === "refund") {

      const refundId = data.TransactionId || data.data?.TransactionId;

      const amount = Number(data.AmountRefunded || 0);

        const original = await Transaction.findOne({
          $or: [
            { flutterwaveId: String(refundId) },
            { flutterwaveReference: data.FlwRef },
            { reference: data.FlwRef }
          ]
        });

      if (!original) {
        return res.status(200).json({
          message: "Original transaction not found"
        });
      }

      const alreadyRefunded = await Transaction.findOne({
        originalReference: original.reference,
        type: "refund"
      });

      if (alreadyRefunded) {
        return res.status(200).json({
          message: "Refund already processed"
        });
      }

      const wallet = await Wallet.findOne({
        phone: original.phone
      });

      if (wallet) {

        const balanceBefore = wallet.balance;

        wallet.balance -= amount;

        if (wallet.balance < 0) {
          wallet.balance = 0;
        }

        await wallet.save();

        await Transaction.create({
          phone: original.phone,
          type: "refund",
          direction: "debit",
          amount,
          reference: data.FlwRef,
          originalReference: original.reference,
          balanceBefore,
          balanceAfter: wallet.balance,
          description: "Flutterwave refund reversal",
          status: "successful"
        });
      }

      return res.status(200).json({
        message: "Refund processed"
      });

    }


    if (!data.data) {
      throw new AppError("Invalid webhook data", 400);
    }

    const verified = await flw.Transaction.verify({
      id: data.data.id
    });

    if (
      verified.status !== "success" ||
      verified.data.status !== "successful"
    ) {
      throw new AppError("Transaction verification failed", 400);
    }

    if (verified.data.currency !== "NGN") {
      throw new AppError("Invalid currency", 400);
    }

      const txRef = verified.data.tx_ref;

      const existing = await Transaction.findOne({
        reference: txRef,
        status:"successful"
      });

      if(existing){
        return res.status(200).json({
          message:"Already processed"
        });
      }

      const pending = await Transaction.findOne({
        reference:txRef,
        status:"pending"
      });

      if(!pending){
        throw new AppError("Pending transaction not found",400);
      }

      if(Number(pending.amount) !== Number(verified.data.amount)){
        throw new AppError("Payment amount mismatch",400);
      }

    const phone = normalizePhone(
      verified.data.meta.phone
    );

    const amount = Number(verified.data.amount);

    if (!amount || amount <= 0) {
      throw new AppError("Invalid amount", 400);
    }

    let wallet = await Wallet.findOne({
      phone
    });

    if (!wallet) {
      wallet = await Wallet.create({
        phone,
        balance: 0
      });
    }

    const balanceBefore = wallet.balance;

    wallet.balance += amount;

    await wallet.save();

    const transaction = await Transaction.create({
      phone,
      type: "fund",
      direction: "credit",
      amount,
      reference: txRef,
      flutterwaveId: verified.data.id,
      flutterwaveReference: verified.data.flw_ref,
      balanceBefore,
      balanceAfter: wallet.balance,
      description: "Flutterwave wallet funding",
      status: "successful"
    });


    await createNotification(
      phone,
      "Wallet Funded",
      `Your wallet has been funded successfully with ₦${Number(amount).toLocaleString()}.`,
      "success",
      transaction._id
    );

    res.status(200).json({
      message: "Webhook processed"
    });

  } catch(error) {

    next(error);

  }

};
module.exports = {
  createPayment,
  verifyPayment,
  flutterwaveWebhook
};