const express = require("express");
const crypto = require("crypto");

const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");

const router = express.Router();


// VTU.ng webhook callback
router.post("/webhook", async (req,res)=>{

  try {


    const signature = req.headers["x-signature"];


    if(!signature){

      return res.status(401).json({
        success:false,
        message:"Missing signature"
      });

    }



    const expectedSignature =
      crypto
      .createHmac(
        "sha256",
        process.env.VTU_USER_PIN
      )
      .update(req.rawBody)
      .digest("hex");



    if(signature !== expectedSignature){

      return res.status(401).json({
        success:false,
        message:"Invalid signature"
      });

    }



    const {
      order_id,
      request_id,
      status,
      product_name,
      meta_data
    } = req.body;



    console.log(
      "VTU WEBHOOK:",
      req.body
    );



    const transaction =
      await Transaction.findOne({

        $or:[
          {
            vtuOrderId:String(order_id)
          },
          {
            vtuRequestId:request_id
          }
        ]

      });



    if(!transaction){

      console.log(
        "VTU transaction not found"
      );

      return res.status(200).json({
        success:true,
        message:"Transaction not found"
      });

    }




    // Prevent duplicate webhook processing

    if(
      transaction.status === "successful" &&
      status === "completed-api"
    ){

      return res.status(200).json({
        success:true,
        message:"Already processed"
      });

    }




    if(
      transaction.status !== "pending" &&
      transaction.status !== "processing"
    ){

      return res.status(200).json({
        success:true,
        message:"Ignoring callback"
      });

    }


    const oldStatus =
      transaction.status;



    if(status === "completed-api"){


      transaction.status =
        "successful";


      await createNotification(

        transaction.phone,

        "VTU Purchase Successful",

        `${product_name || transaction.service} purchase completed successfully.`,

        "success"

      );

    }




    if(status === "refunded"){


      transaction.status =
        "refunded";


      await createNotification(

        transaction.phone,

        "VTU Refund",

        `Your ${product_name || transaction.service} transaction has been refunded.`,

        "warning"

      );


    }





      transaction.vtuStatus = status;
      transaction.providerResponse = req.body;

      transaction.vtuOrderId = String(order_id);
      transaction.vtuRequestId = request_id;


    await transaction.save();



    console.log(
      `VTU status updated ${oldStatus} -> ${transaction.status}`
    );



    return res.status(200).json({

      success:true,

      message:"Webhook processed"

    });



  }catch(error){


    console.log(
      "VTU webhook error:",
      error.message
    );


    return res.status(500).json({

      success:false

    });


  }


});



module.exports = router;
