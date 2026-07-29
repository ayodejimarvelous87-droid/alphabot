const TransactionPin = require("../models/TransactionPin");
const Electricity = require("../models/Electricity");
const Wallet = require("../models/wallet");
const ElectricitySetting = require("../models/ElectricitySetting");
const Transaction = require("../models/Transaction");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");

const {
  verifyCustomer,
  purchaseElectricity
} = require("../services/vtuService");


const { purchase } = require("../services/blitzPayService");

const payElectricity = async (req, res) => {

  try {

    const {
      disco,
      meterNumber,
      meterType,
      amount,
      pin
    } = req.body;


    const phone = normalizePhone(req.user.phone);


    if (!disco || !meterNumber || !amount || !pin) {

      return res.status(400).json({
        message: "Disco, meter number, amount and PIN required"
      });

    }


    const userPin = await TransactionPin.findOne({
      phone
    });


    if (!userPin) {

      return res.status(400).json({
        message: "Create transaction PIN first"
      });

    }


    if (userPin.pin !== pin) {

      return res.status(400).json({
        message: "Incorrect transaction PIN"
      });

    }


    const wallet = await Wallet.findOne({
      phone
    });


    if (!wallet) {

      return res.status(404).json({
        message: "Wallet not found"
      });

    }


    const electricitySetting =
      await ElectricitySetting.findOne({
        disco
      });


    if(!electricitySetting){

      return res.status(400).json({
        message:"Electricity service not configured"
      });

    }


    if(!electricitySetting.active){

      return res.status(400).json({
        message:"Electricity service unavailable"
      });

    }


    const serviceFee =
      Number(electricitySetting.fee || 0);


    const totalAmount =
      Number(amount) + serviceFee;


    if (wallet.balance < totalAmount) {

      return res.status(400).json({
        message: "Insufficient wallet balance"
      });

    }


    const verify = await verifyCustomer({

      customer_id: meterNumber,

      service_id: disco,

      variation_id: meterType || "prepaid"

    });


    if (!verify || verify.code !== "success") {

      return res.status(400).json({

        message: "Meter verification failed",

        verify

      });

    }


    const reference = "ELECTRIC-" + phone + "-" + Date.now();


    const balanceBefore = wallet.balance;


    // Debit wallet first
    wallet.balance -= totalAmount;

    await wallet.save();


    let providerResponse;


    try {

      providerResponse = await purchaseElectricity({
        customer_id: meterNumber,
        service_id: disco,
        variation_id: meterType || "prepaid",
        amount: Number(amount),
        request_id: reference
      });

      if (!providerResponse || providerResponse.code !== "success") {
        throw new Error("Primary electricity provider failed");
      }

    } catch (primaryError) {

      console.log(
        "Primary electricity failed, trying Blitz:",
        primaryError.message
      );

      providerResponse = await purchase({
        type:"electricity",
        provider_code: disco,
        meter_number: meterNumber,
        amount:Number(amount)
      });

      if (
        !providerResponse ||
        providerResponse.success !== true ||
        providerResponse.status !== "success"
      ) {
        throw new Error("Blitz electricity provider failed");
      }

    }





    const electricity = await Electricity.create({

      phone,

      disco,

      meterNumber,

      meterType: meterType || "prepaid",

      amount: totalAmount,

      reference,

      status: "successful"

    });



    await Transaction.create({

      phone,

      type: "electricity",

      direction: "debit",

      amount: totalAmount,

      reference,

      balanceBefore,

      balanceAfter: wallet.balance,

      description: `${disco} electricity payment`,

      status: "successful"

    });



    await createNotification(

      phone,

      "Electricity Payment Successful",

      `${disco} electricity payment completed.`,

      "success"

    );



    res.json({

      message: "Electricity payment successful",

      electricity,

      balance: wallet.balance,

      providerResponse

    });



  } catch(error) {


    console.log(

      "Electricity error:",

      error.response?.data || error.message

    );


    
      // Automatic refund if electricity purchase fails

      wallet.balance += totalAmount;

      await wallet.save();


      await Transaction.create({

        phone,

        type:"refund",

        direction:"credit",

        amount:totalAmount,

        reference,

        originalReference:reference,

        service:"electricity",

        balanceBefore: wallet.balance - totalAmount,

        balanceAfter: wallet.balance,

        description:"Automatic refund - Electricity failed",

        status:"successful"

      });


      await createNotification(

        phone,

        "Electricity Payment Failed",

        `Your ₦${totalAmount.toLocaleString()} has been refunded to your wallet.`,

        "warning"

      );


res.status(500).json({

      message: error.response?.data || error.message

    });


  }

};



module.exports = {

  payElectricity

};