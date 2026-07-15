const TransactionPin = require("../models/TransactionPin");
const normalizePhone = require("../utils/normalizePhone");


// Create or update PIN
const setPin = async(req,res)=>{

  try{

    const {
      phone,
      pin
    } = req.body;


    if(!phone || !pin){

      return res.status(400).json({
        message:"Phone and PIN are required"
      });

    }


    if(pin.length !== 4){

      return res.status(400).json({
        message:"PIN must be 4 digits"
      });

    }


    const cleanPhone = normalizePhone(phone);


    let userPin = await TransactionPin.findOne({
      phone: cleanPhone
    });


    if(userPin){

      userPin.pin = pin;
      userPin.updatedAt = Date.now();

      await userPin.save();

      return res.json({
        message:"Transaction PIN updated successfully"
      });

    }


    await TransactionPin.create({
      phone: cleanPhone,
      pin
    });


    res.json({
      message:"Transaction PIN created successfully"
    });


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }

};


// Verify PIN
const verifyPin = async(req,res)=>{

  try{

    const {
      phone,
      pin
    } = req.body;


    const cleanPhone = normalizePhone(phone);


    const userPin = await TransactionPin.findOne({
      phone: cleanPhone
    });


    if(!userPin){

      return res.status(404).json({
        message:"Transaction PIN not created"
      });

    }


    if(userPin.pin !== pin){

      return res.status(400).json({
        message:"Incorrect transaction PIN"
      });

    }


    res.json({
      message:"PIN verified",
      success:true
    });


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }

};


module.exports = {
  setPin,
  verifyPin
};
