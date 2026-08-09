const BankSettings = require("../models/BankSettings");
const AppError = require("../utils/AppError");


// Get payment account
const getBankSettings = async(req,res)=>{
  try{

    const bank =
      await BankSettings.findOne()
      .sort({createdAt:-1})
      .lean();

    res.json({
      success:true,
      bank:bank || null
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};


// Create/update payment account
const updateBankSettings = async(req,res)=>{
  try{

    const {
      bankName,
      accountNumber,
      accountName,
      instructions
    } = req.body;

    if(
      !bankName ||
      !accountNumber ||
      !accountName
    ){
      throw new AppError(
        "Bank name, account number and account name are required",
        400
      );
    }

    let bank =
      await BankSettings.findOne();

    if(!bank){
      bank =
        await BankSettings.create({
          bankName,
          accountNumber,
          accountName,
          instructions:
            instructions ||
            "Transfer the exact amount and submit your payment reference."
        });
    }else{

      bank.bankName = bankName;
      bank.accountNumber = accountNumber;
      bank.accountName = accountName;

      if(instructions !== undefined){
        bank.instructions = instructions;
      }

      await bank.save();
    }

    res.json({
      success:true,
      message:"Payment account updated",
      bank
    });

  }catch(error){

    res.status(error.statusCode || 500).json({
      success:false,
      message:error.message
    });

  }
};


module.exports = {
  getBankSettings,
  updateBankSettings
};
