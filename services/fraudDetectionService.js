const Transaction = require("../models/Transaction");
const SystemSetting = require("../models/SystemSetting");
const auditLogger = require("./auditLogger");


const checkFraudLimits = async ({
  phone,
  amount,
  type,
  ip = null,
  userAgent = null
}) => {

  const setting =
    await SystemSetting.findOne() ||
    await SystemSetting.create({});


  const today = new Date();
  today.setHours(0,0,0,0);


  const todayTransactions = await Transaction.find({
    phone,
    createdAt:{
      $gte: today
    },
    direction:"debit",
    status:{
      $in:["successful","pending"]
    }
  });


  const dailyTotal = todayTransactions.reduce(
    (sum,tx)=> sum + Number(tx.amount),
    0
  );


  let dailyLimit =
    Number(setting.dailyTransactionLimit);


  if(type === "bank_transfer"){

    dailyLimit =
      Number(setting.dailyTransferLimit);

  }


  if(type === "withdrawal"){

    dailyLimit =
      Number(setting.dailyWithdrawalLimit);

  }


  if(
    dailyTotal + Number(amount)
    >
    dailyLimit
  ){

    await auditLogger({
      action:"FRAUD_DAILY_LIMIT_EXCEEDED",
      target:phone,
      ip,
      userAgent,
      details:{
        type,
        amount,
        dailyTotal
      }
    });


    throw new Error(
      "Daily transaction limit exceeded"
    );

  }



  if(todayTransactions.length >= Number(setting.maxTransactionsPerDay)){

    await auditLogger({
      action:"FRAUD_TRANSACTION_COUNT_LIMIT",
      target:phone,
      ip,
      userAgent,
      details:{
        type,
        count:todayTransactions.length
      }
    });


    throw new Error(
      "Daily transaction count limit exceeded"
    );

  }



  const windowStart =
    new Date(
      Date.now()
      -
      Number(setting.fraudVelocityWindow) * 60 * 1000
    );


  const recentTransactions = await Transaction.countDocuments({
    phone,
    createdAt:{
      $gte:windowStart
    }
  });



  if(
    recentTransactions >=
    Number(setting.maxTransactionsPerWindow)
  ){

    await auditLogger({
      action:"FRAUD_VELOCITY_WARNING",
      target:phone,
      ip,
      userAgent,
      details:{
        type,
        recentTransactions
      }
    });


    throw new Error(
      "Too many transactions. Try again later"
    );

  }


  return true;

};


module.exports = {
  checkFraudLimits
};
