const Flutterwave = require("flutterwave-node-v3");
const Wallet = require("../models/wallet");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const normalizePhone = require("../utils/phone");
const axios = require("axios");

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
      return res.status(404).json({
        message:"User not found"
      });
    }

    const phone = normalizePhone(user.phone);

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Invalid amount"
      });
    }

    const payload = {

      tx_ref: "ALPHABOT-" + Date.now(),

      amount: Number(amount),

      currency: "NGN",

      redirect_url:
      "https://alphabot-frontend-chi.vercel.app/dashboard/wallet",

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

    res.status(500).json({
      message:error.response?.data || error.message
    });

  }
};


const verifyPayment = async (req,res)=>{

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

      return res.status(400).json({
        message:"Payment verification failed"
      });

    }


    const tx = response.data;


    const pending = await Transaction.findOne({
      reference: tx.tx_ref,
      status:"pending"
    });


    if(!pending){

      return res.json({
        message:"Payment already processed"
      });

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


    const balanceBefore = wallet.balance;

    wallet.balance += Number(tx.amount);

    await wallet.save();


    await Transaction.create({

      phone: pending.phone,

      type:"fund",

      direction:"credit",

      amount:Number(tx.amount),

      reference:tx.tx_ref,

      flutterwaveId:String(tx.id),

      flutterwaveReference:tx.flw_ref,

      balanceBefore,

      balanceAfter:wallet.balance,

      description:"Flutterwave wallet funding",

      status:"successful"

    });


    pending.status="completed";
    pending.flutterwaveId=String(tx.id);
    pending.flutterwaveReference=tx.flw_ref;

    await pending.save();


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
      return res.status(400).json({
        message: "Invalid webhook data"
      });
    }

    const verified = await flw.Transaction.verify({
      id: data.data.id
    });

    if (
      verified.status !== "success" ||
      verified.data.status !== "successful"
    ) {
      return res.status(400).json({
        message: "Transaction verification failed"
      });
    }

    if (verified.data.currency !== "NGN") {
      return res.status(400).json({
        message: "Invalid currency"
      });
    }

    const txRef = verified.data.tx_ref;

    const existing = await Transaction.findOne({
      reference: txRef
    });

    if (existing) {
      return res.status(200).json({
        message: "Already processed"
      });
    }

    const phone = normalizePhone(
      verified.data.meta.phone
    );

    const amount = Number(verified.data.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount"
      });
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

    await Transaction.create({
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

    res.status(200).json({
      message: "Webhook processed"
    });

  } catch(error) {

    res.status(500).json({
      message: error.message
    });

  }

};
module.exports = {
  createPayment,
  verifyPayment,
  flutterwaveWebhook
};
