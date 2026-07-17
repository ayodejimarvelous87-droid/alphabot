const Wallet = require("../../models/wallet");
const Withdrawal = require("../../models/Withdrawal");

const handleWithdrawal = async ({
  phone,
  text,
  state,
  sendMessage
}) => {

  if (text === "withdraw" || text === "withdrawal") {

    state.state = "awaiting_withdraw_amount";
    state.data = {};

    await state.save();

    await sendMessage(
      phone,
      "💸 Enter withdrawal amount:"
    );

    return true;
  }


  if (state.state === "awaiting_withdraw_amount") {

    const amount = Number(text);

    if (isNaN(amount) || amount <= 0) {

      await sendMessage(
        phone,
        "Enter a valid amount."
      );

      return true;
    }

    const wallet = await Wallet.findOne({ phone });

    if (!wallet || wallet.balance < amount) {

      await sendMessage(
        phone,
        "❌ Insufficient wallet balance."
      );

      state.state = null;
      state.data = {};
      await state.save();

      return true;
    }


    state.data.amount = amount;
    state.state = "awaiting_withdraw_bank";

    await state.save();

    await sendMessage(
      phone,
      "🏦 Enter bank name:"
    );

    return true;
  }


  if (state.state === "awaiting_withdraw_bank") {

    state.data.bankName = text;
    state.state = "awaiting_withdraw_account";

    await state.save();

    await sendMessage(
      phone,
      "Enter account number:"
    );

    return true;
  }


  if (state.state === "awaiting_withdraw_account") {

    state.data.accountNumber = text;
    state.state = "awaiting_withdraw_name";

    await state.save();

    await sendMessage(
      phone,
      "Enter account name:"
    );

    return true;
  }


  if (state.state === "awaiting_withdraw_name") {

    const wallet = await Wallet.findOne({ phone });

    const amount = state.data.amount;
    const fee = 0;

    wallet.balance -= amount;
    await wallet.save();


    const withdrawal = await Withdrawal.create({
      phone,
      bankName: state.data.bankName,
      accountNumber: state.data.accountNumber,
      accountName: text,
      amount,
      fee,
      totalDeducted: amount,
      reference: "WD" + Date.now(),
      status: "pending"
    });


    await sendMessage(
      phone,
      `✅ Withdrawal request submitted.

Amount: ₦${withdrawal.amount}
Bank: ${withdrawal.bankName}
Account: ${withdrawal.accountNumber}

Status: Pending`
    );


    state.state = null;
    state.data = {};

    await state.save();

    return true;
  }


  return false;

};


module.exports = {
  handleWithdrawal
};
