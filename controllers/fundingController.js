const AppError = require("../utils/AppError");
const FundingRequest = require("../models/FundingRequest");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");
const { sendPushNotification } = require("../services/firebaseService");
const DeviceToken = require("../models/DeviceToken");


// Customer submits funding request
const createFundingRequest = async (req, res) => {
  try {

    const { phone, amount, reference } = req.body;

    const cleanPhone = normalizePhone(phone);


    if (!cleanPhone || !amount) {
      throw new AppError("Phone and amount are required", 400);
    }


    const request = await FundingRequest.create({

      phone: cleanPhone,

      amount,

      reference: reference || null


    });

      await createNotification(
        "admin",
        "New Wallet Funding Request 🔔",
        `₦${Number(request.amount).toLocaleString()} manual funding request received.`,
        "info"
      );


      const devices = await DeviceToken.find();

      for(const device of devices){

        await sendPushNotification(
          device.token,
          "New Wallet Funding Request 🔔",
          `₦${Number(request.amount).toLocaleString()} manual funding request received`
        );

      }



    res.json({

      message:"Funding request submitted",

      request

    });


  } catch(error){

    res.status(500).json({

      message:error.message

    });

  }
};





// Admin gets pending funding requests
const getFundingRequests = async(req,res)=>{

  try{

    const requests = await FundingRequest.find({

      status:"pending"

    });


    res.json(requests);


  }catch(error){

    res.status(500).json({

      message:error.message

    });

  }

};





// Admin approves funding
const approveFunding = async(req,res)=>{

  try{

    const { id } = req.params;


      const request = await FundingRequest.findOneAndUpdate(
        {
          _id:id,
          status:"pending"
        },
        {
          status:"processing"
        },
        {
          new:true
        }
      );


      if(!request){

        throw new AppError("Request already processed or not found", 400);

      }



    const wallet = await Wallet.findOne({

      $or: [
        { phone: request.phone },
        { phone: request.phone.replace("+234", "0") }
      ]

    });



    if(!wallet){

      throw new AppError("Wallet not found", 404);

    }



    const balanceBefore = wallet.balance;


    wallet.balance += Number(request.amount);


    await wallet.save();




    await Transaction.create({

      phone:request.phone,

      type:"fund",

      direction:"credit",

      amount:Number(request.amount),

      reference:request.reference || "FUND-" + Date.now(),

      balanceBefore,

      balanceAfter:wallet.balance,

      description:`Manual funding`,

      status:"successful"

    });





    await createNotification(

      request.phone,

      "Wallet Funded",

      `₦${Number(request.amount).toLocaleString()} funding request approved.`,

      "success"

    );


    request.status="approved";

    await request.save();



    res.json({

      message:"Funding approved",

      balance:wallet.balance

    });



  }catch(error){

    res.status(500).json({

      message:error.message

    });

  }

};





// Admin rejects funding
const rejectFunding = async(req,res)=>{

  try{

    const { id } = req.params;


    const request = await FundingRequest.findById(id);



    if(!request){

      throw new AppError("Funding request not found", 404);

    }



    request.status="rejected";


    await request.save();


    await createNotification(
      request.phone,
      "Funding Rejected",
      `₦${Number(request.amount).toLocaleString()} funding request was rejected.`,
      "warning"
    );


    res.json({

      message:"Funding rejected"

    });



  }catch(error){

    res.status(500).json({

      message:error.message

    });

  }

};





module.exports = {

createFundingRequest,

getFundingRequests,

approveFunding,

rejectFunding

};
