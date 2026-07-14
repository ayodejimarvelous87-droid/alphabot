const FundingRequest = require("../models/FundingRequest");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const normalizePhone = require("../utils/phone");


// Customer submits funding request
const createFundingRequest = async (req, res) => {
  try {

    const { phone, amount, reference } = req.body;

    const cleanPhone = normalizePhone(phone);


    if (!cleanPhone || !amount) {
      return res.status(400).json({
        message: "Phone and amount are required"
      });
    }


    const request = await FundingRequest.create({

      phone: cleanPhone,

      amount,

      reference: reference || null

    });


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


    const request = await FundingRequest.findById(id);


    if(!request){

      return res.status(404).json({

        message:"Funding request not found"

      });

    }



    if(request.status !== "pending"){

      return res.status(400).json({

        message:"Request already processed"

      });

    }



    const wallet = await Wallet.findOne({

      $or: [
        { phone: request.phone },
        { phone: request.phone.replace("+234", "0") }
      ]

    });



    if(!wallet){

      return res.status(404).json({

        message:"Wallet not found"

      });

    }



    const balanceBefore = wallet.balance;


    wallet.balance += Number(request.amount);


    await wallet.save();




    await Transaction.create({

      phone:request.phone,

      type:"fund",

      direction:"credit",

      amount:Number(request.amount),

      reference:request.reference || "manual",

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

      return res.status(404).json({

        message:"Funding request not found"

      });

    }



    request.status="rejected";


    await request.save();



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
