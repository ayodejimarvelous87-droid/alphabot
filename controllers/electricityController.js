const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
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
const { checkIdempotency } = require("../utils/idempotency");

const payElectricity = async (req, res) => {

  try {

    const {
      disco,
      meterNumber,
      meterType,
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


    if (!disco || !meterNumber || !amount || !pin) {

      throw new AppError("Disco, meter number, amount and PIN required", 400);

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


    const electricitySetting =
      await ElectricitySetting.findOne({
        disco
      });


    if(!electricitySetting){

      throw new AppError("Electricity service not configured", 400);

    }


    if(!electricitySetting.active){

      throw new AppError("Electricity service unavailable", 400);

    }


    const serviceFee =
      Number(electricitySetting.fee || 0);


    const totalAmount =
      Number(amount) + serviceFee;


    if (wallet.balance < totalAmount) {

      throw new AppError("Insufficient wallet balance", 400);

    }


    const verify = await verifyCustomer({

      customer_id: meterNumber,

      service_id: disco,

      variation_id: meterType || "prepaid"

    });


    if (!verify || verify.code !== "success") {

      throw new AppError("Meter verification failed", 400);

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

      vtuRequestId:
        providerResponse.reference ||
        providerResponse.request_id ||
        reference,

      vtuOrderId:
        providerResponse.data?.order ||
        providerResponse.order_id ||
        null,

      providerResponse: providerResponse,

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

        idempotencyKey,

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