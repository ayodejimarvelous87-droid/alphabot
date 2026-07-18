const Withdrawal = require("../../models/Withdrawal");
const Wallet = require("../../models/wallet");
const Transaction = require("../../models/Transaction");

const handleAdminWithdrawal = async ({
  phone,
  text,
  sendMessage
}) => {

  if (phone !== process.env.ADMIN_PHONE) {
    return false;
  }


  if (text.startsWith("approve withdrawal")) {

    const id = text.replace("approve withdrawal", "").trim();

    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      await sendMessage(phone, "❌ Withdrawal not found.");
      return true;
    }


    withdrawal.status = "successful";

    await withdrawal.save();


    await sendMessage(
      phone,
      "✅ Withdrawal approved."
    );

    return true;
  }



  if (text.startsWith("reject withdrawal")) {

    const id = text.replace("reject withdrawal", "").trim();

    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      await sendMessage(phone, "❌ Withdrawal not found.");
      return true;
    }


    const wallet = await Wallet.findOne({
      phone: withdrawal.phone
    });


    if (wallet) {

      const before = wallet.balance;

      wallet.balance += withdrawal.amount;

      await wallet.save();


      await Transaction.create({

        phone: withdrawal.phone,

        type: "refund",

        direction: "credit",

        amount: withdrawal.amount,

        balanceBefore: before,

        balanceAfter: wallet.balance,

        description: "Withdrawal rejected refund"

      });

    }


    withdrawal.status = "failed";

    await withdrawal.save();


    await sendMessage(
      phone,
      "❌ Withdrawal rejected and refunded."
    );


    return true;
  }


  return false;

};


module.exports = {
  handleAdminWithdrawal
};
