const express = require("express");
const crypto = require("crypto");

const Transaction = require("../models/Transaction");
const EPin = require("../models/EPin");
const Wallet = require("../models/wallet");
const { createNotification } = require("../services/notificationService");

const router = express.Router();


// ============================================================
// VTU.ng WEBHOOK CALLBACK
// ============================================================

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
      JSON.stringify(req.body,null,2)
    );


    // ========================================================
    // BUILD SAFE LOOKUP CONDITIONS
    // ========================================================

    const transactionConditions = [];

    if(order_id !== undefined && order_id !== null){

      transactionConditions.push({
        vtuOrderId:String(order_id)
      });

    }

    if(request_id){

      transactionConditions.push({
        vtuRequestId:String(request_id)
      });

    }


    let transaction = null;


    if(transactionConditions.length > 0){

      transaction =
        await Transaction.findOne({
          $or:transactionConditions
        });

    }


    if(!transaction){

      console.log(
        "VTU transaction not found"
      );

      return res.status(200).json({
        success:true,
        message:"Transaction not found"
      });

    }


    // ========================================================
    // DUPLICATE / ALREADY FINALIZED CALLBACK
    // ========================================================

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
      transaction.status === "refunded" &&
      status === "refunded"
    ){

      return res.status(200).json({
        success:true,
        message:"Refund already processed"
      });

    }


    // ========================================================
    // ONLY PROCESS PENDING / PROCESSING TRANSACTIONS
    // ========================================================

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


    // ========================================================
    // ePIN LOOKUP
    // ========================================================

    let epin = null;


    if(transaction.type === "recharge_pin"){

      const epinConditions = [];


      if(order_id !== undefined && order_id !== null){

        epinConditions.push({
          vtuOrderId:String(order_id)
        });

      }


      if(request_id){

        epinConditions.push({
          vtuRequestId:String(request_id)
        });

      }


      if(epinConditions.length > 0){

        epin =
          await EPin.findOne({
            $or:epinConditions
          });

      }


      // Fallback using transaction's stored IDs

      if(!epin){

        const fallbackConditions = [];


        if(transaction.vtuOrderId){

          fallbackConditions.push({
            vtuOrderId:String(transaction.vtuOrderId)
          });

        }


        if(transaction.vtuRequestId){

          fallbackConditions.push({
            vtuRequestId:String(transaction.vtuRequestId)
          });

        }


        if(fallbackConditions.length > 0){

          epin =
            await EPin.findOne({
              $or:fallbackConditions
            });

        }

      }

    }


    // ========================================================
    // COMPLETED
    // ========================================================

    if(status === "completed-api"){

      // --------------------------------------------------------
      // ePIN COMPLETION
      //
      // IMPORTANT:
      // VTU can report completed-api before the actual PIN
      // payload is available. Never mark an ePIN successful
      // unless at least one actual PIN was received.
      // --------------------------------------------------------

      if(
        transaction.type === "recharge_pin" &&
        epin
      ){

        const epinList =
          req.body.epins ||
          req.body.data?.epins ||
          [];


        const pins =
          Array.isArray(epinList)
          ? epinList
              .map(item => {

                if(typeof item === "string"){
                  return item;
                }

                return item?.pin;

              })
              .filter(Boolean)
          : [];


        // ------------------------------------------------------
        // VTU says completed but no PIN supplied yet.
        // Keep everything processing.
        // ------------------------------------------------------

        if(pins.length === 0){

          epin.status =
            "processing";

          epin.providerResponse =
            req.body;


          if(order_id !== undefined && order_id !== null){

            epin.vtuOrderId =
              String(order_id);

            epin.order_id =
              String(order_id);

          }


          if(request_id){

            epin.vtuRequestId =
              String(request_id);

          }


          await epin.save();


          transaction.status =
            "processing";

          transaction.vtuStatus =
            status;

          transaction.providerResponse =
            req.body;


          if(order_id !== undefined && order_id !== null){

            transaction.vtuOrderId =
              String(order_id);

          }


          if(request_id){

            transaction.vtuRequestId =
              String(request_id);

          }


          await transaction.save();


          console.log(
            "VTU ePIN completed without PIN payload; keeping processing"
          );


          return res.status(200).json({

            success:true,

            message:"ePIN completed but PIN payload not yet available"

          });

        }


        // ------------------------------------------------------
        // Actual PIN received — this is the real completion.
        // ------------------------------------------------------

        epin.pins =
          pins;

        epin.status =
          "successful";

        epin.providerResponse =
          req.body;


        if(order_id !== undefined && order_id !== null){

          epin.vtuOrderId =
            String(order_id);

          epin.order_id =
            String(order_id);

        }


        if(request_id){

          epin.vtuRequestId =
            String(request_id);

        }


        await epin.save();


        transaction.status =
          "successful";

        transaction.vtuStatus =
          status;

        transaction.providerResponse =
          req.body;


        if(order_id !== undefined && order_id !== null){

          transaction.vtuOrderId =
            String(order_id);

        }


        if(request_id){

          transaction.vtuRequestId =
            String(request_id);

        }


        await transaction.save();


        console.log(
          `EPIN completed: ${pins.length} PIN(s) saved`
        );


        await createNotification(

          transaction.phone,

          "ePIN Purchase Successful",

          "Your recharge PIN is now ready.",

          "success"

        );


        return res.status(200).json({

          success:true,

          message:"ePIN completed successfully"

        });

      }


      // --------------------------------------------------------
      // Non-ePIN completed transaction
      // --------------------------------------------------------

      transaction.status =
        "successful";

      transaction.vtuStatus =
        status;

      transaction.providerResponse =
        req.body;


      if(order_id !== undefined && order_id !== null){

        transaction.vtuOrderId =
          String(order_id);

      }


      if(request_id){

        transaction.vtuRequestId =
          String(request_id);

      }


      await createNotification(

        transaction.phone,

        "VTU Purchase Successful",

        `${product_name || transaction.service} purchase completed successfully.`,

        "success"

      );

    }


    // ========================================================
    // REFUNDED
    // ========================================================

    if(status === "refunded"){

      transaction.status =
        "refunded";


      // ------------------------------------------------------
      // REFUND MONEY TO USER WALLET
      // ------------------------------------------------------

      const refundAmount =
        Number(transaction.amount || 0);


      if(refundAmount > 0){

        const wallet =
          await Wallet.findOne({
            phone:transaction.phone
          });


        if(!wallet){

          throw new Error(
            `Wallet not found for VTU refund: ${transaction.phone}`
          );

        }


        const balanceBefore =
          Number(wallet.balance);


        wallet.balance =
          Number(wallet.balance) +
          refundAmount;


        await wallet.save();


        console.log(
          `VTU REFUND: +₦${refundAmount} to ${transaction.phone}`
        );


        // ----------------------------------------------------
        // CREATE REFUND TRANSACTION
        // ----------------------------------------------------

        const refundReference =
          `${transaction.reference}-REFUND`;


        const existingRefund =
          await Transaction.findOne({
            reference:refundReference
          });


        if(!existingRefund){

          await Transaction.create({

            phone:transaction.phone,

            type:"refund",

            service:transaction.service,

            direction:"credit",

            amount:refundAmount,

            reference:refundReference,

            originalReference:
              transaction.reference,

            balanceBefore,

            balanceAfter:
              wallet.balance,

            description:
              `Automatic refund - ${transaction.service}`,

            status:"successful"

          });

        }

      }


      // ------------------------------------------------------
      // ePIN REFUND
      // ------------------------------------------------------

      if(
        transaction.type === "recharge_pin" &&
        epin
      ){

        epin.status =
          "failed";


        epin.providerResponse =
          req.body;


        if(order_id !== undefined && order_id !== null){

          epin.vtuOrderId =
            String(order_id);

          epin.order_id =
            String(order_id);

        }


        if(request_id){

          epin.vtuRequestId =
            String(request_id);

        }


        await epin.save();

      }


      await createNotification(

        transaction.phone,

        "VTU Refund",

        `Your ₦${refundAmount.toLocaleString()} ${product_name || transaction.service} transaction has been refunded to your wallet.`,

        "warning"

      );

    }


    // ========================================================
    // SAVE PROVIDER STATUS
    // ========================================================

    transaction.vtuStatus =
      status;


    transaction.providerResponse =
      req.body;


    if(order_id !== undefined && order_id !== null){

      transaction.vtuOrderId =
        String(order_id);

    }


    if(request_id){

      transaction.vtuRequestId =
        String(request_id);

    }


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


    console.log(
      "VTU webhook full error:",
      error.stack
    );


    return res.status(500).json({

      success:false,

      message:"Webhook processing failed"

    });

  }

});


module.exports = router;
