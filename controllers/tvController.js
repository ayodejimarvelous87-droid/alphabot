const TransactionPin = require("../models/TransactionPin");
const TVSubscription = require("../models/TVSubscription");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");

const {
  verifyCustomer,
  purchaseTV
} = require("../services/vtuService");
const { purchase, getCablePackages } = require("../services/blitzPayService");


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


    const phone = normalizePhone(req.user.phone);


    if (!provider || !smartCardNumber || !variation_id || !amount || !pin) {

      return res.status(400).json({
        message: "Provider, smart card, package, amount and PIN required"
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


    if (wallet.balance < Number(amount)) {

      return res.status(400).json({
        message: "Insufficient wallet balance"
      });

    }


    const verify = await verifyCustomer({

      customer_id: smartCardNumber,

      service_id: provider

    });


    if (!verify || verify.code !== "success") {

      return res.status(400).json({

        message: "Smart card verification failed",

        verify

      });

    }


    const reference = "TV-" + phone + "-" + Date.now();


    const balanceBefore = wallet.balance;


    // Debit wallet first
    wallet.balance -= Number(amount);

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

            amount: Number(amount)

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

        if (!providerResponse) {

          throw new Error("Provider failed");

        }


    } catch (err) {


      // Refund wallet if VTU fails

      wallet.balance += Number(amount);

      await wallet.save();


      await Transaction.create({

        phone,

        type: "refund",

        direction: "credit",

        amount: Number(amount),

        reference,

        balanceBefore: wallet.balance - Number(amount),

        balanceAfter: wallet.balance,

        description: "Automatic refund - TV failed",

        status: "successful"

      });


      return res.status(400).json({

        message: "TV subscription failed",

        providerResponse: err.response?.data || err.message

      });

    }



    const subscription = await TVSubscription.create({

      phone,

      provider,

      smartCardNumber,

      package: variation_id,
        vtu_variation_id,

      amount: Number(amount),

      reference,

      status: "successful"

    });



    await Transaction.create({

      phone,

      type: "tv",

      direction: "debit",

      amount: Number(amount),

      reference,

      balanceBefore,

      balanceAfter: wallet.balance,

      description: `${provider} TV subscription`,

      status: "successful"

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

    const plans = await getCablePackages();

    res.json({
      success: true,
      plans
    });

  } catch (error) {

    console.log("TV Plans error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch TV plans"
    });

  }
};

module.exports = {
  subscribeTV, getTVPlans
};
