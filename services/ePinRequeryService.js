const EPin = require("../models/EPin");
const Transaction = require("../models/Transaction");
const { requeryOrder } = require("./vtuService");
const { createNotification } = require("./notificationService");
const User = require("../models/User");
const sendEmail = require("./emailService");

const syncEPin = async (reference) => {

  const epin = await EPin.findOne({
    reference:String(reference)
  });

  if(!epin){
    throw new Error("ePIN record not found");
  }

  const requestId =
    epin.vtuRequestId ||
    epin.reference;

  if(!requestId){
    throw new Error("ePIN has no VTU request ID");
  }

  const result =
    await requeryOrder(requestId);

  console.log(
    "EPIN REQUERY:",
    JSON.stringify(result,null,2)
  );

  const data =
    result?.data || {};

  const status =
    data.status;

  const epinList =
    data.epins ||
    result?.epins ||
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

  // ----------------------------------------------------------
  // Always save the provider response and identifiers
  // ----------------------------------------------------------

  epin.providerResponse =
    result;

  if(data.order_id !== undefined && data.order_id !== null){

    epin.vtuOrderId =
      String(data.order_id);

    epin.order_id =
      String(data.order_id);

  }

  if(data.request_id){

    epin.vtuRequestId =
      String(data.request_id);

  }


  // ----------------------------------------------------------
  // Find matching transaction
  // ----------------------------------------------------------

  let transaction =
    await Transaction.findOne({
      reference:epin.reference
    });


  if(!transaction){

    transaction =
      await Transaction.findOne({
        vtuRequestId:String(requestId)
      });

  }


  // ----------------------------------------------------------
  // COMPLETED + PINS RECEIVED
  // ----------------------------------------------------------

  if(
    status === "completed-api" &&
    pins.length > 0
  ){

    epin.pins = pins;
    epin.status = "successful";

    await epin.save();


    if(transaction){

      transaction.status =
        "successful";

      transaction.vtuStatus =
        status;

      transaction.vtuOrderId =
        String(data.order_id);

      transaction.vtuRequestId =
        String(data.request_id || requestId);

      transaction.providerResponse =
        result;

      transaction.pin =
        pins.join("\n");

      await transaction.save();

    }


    // --------------------------------------------------------
    // Email
    // --------------------------------------------------------

    const user =
      await User.findOne({
        phone:epin.phone
      });


    if(
      user?.email &&
      !transaction?.emailSent
    ){

      await sendEmail(
        user.email,
        "Your ePIN Purchase",
        `Your ${epin.network} ePIN codes are:\n\n${pins.join("\n")}\n\nThank you for using AlphaBot.`
      );


      if(transaction){

        transaction.emailSent =
          true;

        await transaction.save();

      }

    }


    if(
      transaction &&
      !transaction.notificationSent
    ){

      await createNotification(
        epin.phone,
        "ePIN Purchase Successful",
        `${epin.network} recharge PIN is now available.`,
        "success",
        transaction._id
      );

      transaction.notificationSent = true;

      await transaction.save();

    }


    return {
      status:"successful",
      pins,
      epin,
      transaction
    };

  }


  // ----------------------------------------------------------
  // COMPLETED BUT PROVIDER DID NOT RETURN PIN
  // ----------------------------------------------------------

  if(status === "completed-api"){

    // Do NOT mark the ePIN as failed.
    // VTU says completed, but no PIN was returned.

    epin.status =
      "processing";

    await epin.save();


    if(transaction){

      transaction.vtuStatus =
        status;

      transaction.vtuOrderId =
        String(data.order_id);

      transaction.vtuRequestId =
        String(data.request_id || requestId);

      transaction.providerResponse =
        result;

      transaction.status =
        "processing";

      await transaction.save();

    }


    return {
      status:"completed-no-pin",
      pins:[],
      epin,
      transaction
    };

  }


  // ----------------------------------------------------------
  // STILL PROCESSING
  // ----------------------------------------------------------

  if(
    status === "processing-api" ||
    status === "processing"
  ){

    epin.status =
      "processing";

    await epin.save();


    if(transaction){

      transaction.status =
        "processing";

      transaction.vtuStatus =
        status;

      transaction.providerResponse =
        result;

      await transaction.save();

    }


    return {
      status:"processing",
      pins:[],
      epin,
      transaction
    };

  }


  // ----------------------------------------------------------
  // REFUNDED
  // ----------------------------------------------------------

  if(status === "refunded"){

    epin.status =
      "failed";

    await epin.save();


    if(transaction){

      transaction.status =
        "refunded";

      transaction.vtuStatus =
        status;

      transaction.providerResponse =
        result;

      await transaction.save();

    }


    await createNotification(
      epin.phone,
      "ePIN Refund",
      `${epin.network} ePIN order was refunded.`,
      "warning"
    );


    return {
      status:"refunded",
      pins:[],
      epin,
      transaction
    };

  }


  // ----------------------------------------------------------
  // UNKNOWN STATUS
  // ----------------------------------------------------------

  await epin.save();


  if(transaction){

    transaction.vtuStatus =
      status || null;

    transaction.providerResponse =
      result;

    await transaction.save();

  }


  return {
    status:status || "unknown",
    pins,
    epin,
    transaction
  };

};


module.exports = {
  syncEPin
};
