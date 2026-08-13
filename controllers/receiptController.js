const AppError = require("../utils/AppError");
const Transaction = require("../models/Transaction");


const normalizePhone = (phone)=>{

  if(!phone) return phone;

  phone = phone.replace(/\s+/g,"");

  if(phone.startsWith("0")){
    return "+234" + phone.slice(1);
  }

  return phone;

};


const getReceipt = async(req,res)=>{

  try{

    const { id } = req.params;

    if(!req.user?.phone){

      throw new AppError(
        "Unauthorized",
        401
      );

    }


    const buyerPhone =
      normalizePhone(req.user.phone);


    const transaction =
      await Transaction.findOne({
        _id:id,
        phone:buyerPhone
      });


    if(!transaction){

      throw new AppError(
        "Receipt not found",
        404
      );

    }


    res.json({

      receipt:transaction

    });


  }catch(error){

    const status =
      error.statusCode ||
      error.status ||
      500;

    res.status(status).json({

      message:error.message

    });

  }

};


module.exports = {

  getReceipt

};
