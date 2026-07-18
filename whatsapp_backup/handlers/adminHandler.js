const User = require("../../models/User");
const Wallet = require("../../models/wallet");
const Transaction = require("../../models/Transaction");
const FundingRequest = require("../../models/FundingRequest");
const Withdrawal = require("../../models/Withdrawal");

const ADMIN_PHONE = process.env.ADMIN_PHONE;

const handleAdmin = async ({
  phone,
  text,
  state,
  sendMessage,
  sendButtons
}) => {

  if (phone !== ADMIN_PHONE) {
    return false;
  }


  if (text === "admin") {

    state.state = "admin_menu";
    state.data = {};

    await state.save();

    await sendButtons(phone, "👑 AlphaBot Admin Panel", [
      "Users",
      "Funding Requests",
      "Withdrawals",
      "Wallet Control",
      "Stats",
      "BACK"
    ]);

    return true;
  }



  if (text.startsWith("user ")) {

    const searchPhone = text.replace("user ", "").trim();

    const user = await User.findOne({ phone: searchPhone });

    if (!user) {
      await sendMessage(phone, "❌ User not found.");
      return true;
    }

    const wallet = await Wallet.findOne({ phone: searchPhone });

    await sendMessage(
      phone,
      `👤 User Details\n\nName: ${user.name}\nPhone: ${user.phone}\nWallet: ₦${wallet?.balance || 0}\nReferral: ${user.referralCode || "None"}`
    );

    return true;
  }


  if (text.startsWith("credit ")) {

    const parts = text.split(" ");
    const targetPhone = parts[1];
    const amount = Number(parts[2]);

    if (!targetPhone || !amount || amount <= 0) {
      await sendMessage(phone, "Use: credit phone amount");
      return true;
    }

    const wallet = await Wallet.findOne({ phone: targetPhone });

    if (!wallet) {
      await sendMessage(phone, "❌ Wallet not found.");
      return true;
    }

    const balanceBefore = wallet.balance;

    wallet.balance += amount;

    await wallet.save();

    await Transaction.create({
      phone: targetPhone,
      type: "admin_credit",
      direction: "credit",
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      description: "Admin wallet credit"
    });

    await sendMessage(phone, `✅ Wallet credited\n\nPhone: ${targetPhone}\nAmount: ₦${amount}\nBalance: ₦${wallet.balance}`);

    return true;
  }


  if (text.startsWith("debit ")) {

    const parts = text.split(" ");
    const targetPhone = parts[1];
    const amount = Number(parts[2]);

    if (!targetPhone || !amount || amount <= 0) {
      await sendMessage(phone, "Use: debit phone amount");
      return true;
    }

    const wallet = await Wallet.findOne({ phone: targetPhone });

    if (!wallet) {
      await sendMessage(phone, "❌ Wallet not found.");
      return true;
    }

    if (wallet.balance < amount) {
      await sendMessage(phone, "❌ Insufficient wallet balance.");
      return true;
    }

    const balanceBefore = wallet.balance;

    wallet.balance -= amount;

    await wallet.save();

    await Transaction.create({
      phone: targetPhone,
      type: "admin_debit",
      direction: "debit",
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      description: "Admin wallet debit"
    });

    await sendMessage(phone, `✅ Wallet debited\n\nPhone: ${targetPhone}\nAmount: ₦${amount}\nBalance: ₦${wallet.balance}`);

    return true;
  }


  if (text.startsWith("approve funding ")) {

    const id = text.replace("approve funding ", "").trim();

    const request = await FundingRequest.findById(id);

    if (!request) {
      await sendMessage(phone, "❌ Funding request not found.");
      return true;
    }

    if (request.status !== "pending") {
      await sendMessage(phone, "❌ Already processed.");
      return true;
    }

    const wallet = await Wallet.findOne({ phone: request.phone });

    if (!wallet) {
      await sendMessage(phone, "❌ Wallet not found.");
      return true;
    }

    const balanceBefore = wallet.balance;

    wallet.balance += Number(request.amount);
    await wallet.save();

    await Transaction.create({
      phone: request.phone,
      type: "fund",
      direction: "credit",
      amount: Number(request.amount),
      balanceBefore,
      balanceAfter: wallet.balance,
      description: "Admin approved funding"
    });

    request.status = "approved";
    await request.save();

    await sendMessage(phone, "✅ Funding approved.");
    return true;
  }

  if (text.startsWith("reject funding ")) {

    const id = text.replace("reject funding ", "").trim();

    const request = await FundingRequest.findById(id);

    if (!request) {
      await sendMessage(phone, "❌ Funding request not found.");
      return true;
    }

    request.status = "rejected";
    await request.save();

    await sendMessage(phone, "❌ Funding rejected.");
    return true;
  }


  if (text.startsWith("approve withdrawal ")) {

    const id = text.replace("approve withdrawal ", "").trim();

    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      await sendMessage(phone, "❌ Withdrawal not found.");
      return true;
    }

    withdrawal.status = "successful";
    await withdrawal.save();

    await Transaction.create({
      phone: withdrawal.phone,
      type: "withdrawal",
      direction: "debit",
      amount: withdrawal.amount,
      reference: withdrawal.reference,
      description: "Admin approved withdrawal",
      status: "successful"
    });

    await sendMessage(phone, "✅ Withdrawal approved.");
    return true;
  }

  if (text.startsWith("reject withdrawal ")) {

    const id = text.replace("reject withdrawal ", "").trim();

    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      await sendMessage(phone, "❌ Withdrawal not found.");
      return true;
    }

    const wallet = await Wallet.findOne({ phone: withdrawal.phone });

    if (wallet) {
      wallet.balance += withdrawal.amount;
      await wallet.save();
    }

    withdrawal.status = "failed";
    await withdrawal.save();

    await sendMessage(phone, "❌ Withdrawal rejected and refunded.");
    return true;
  }

  if (state.state === "admin_menu") {


    if (text === "users") {

      const count = await User.countDocuments();

      await sendMessage(
        phone,
        `👥 Total Users: ${count}`
      );

      return true;
    }


    if (text === "funding requests") {

      const requests = await FundingRequest.find({
        status:"pending"
      }).limit(5);


      if (!requests.length) {

        await sendMessage(
          phone,
          "No pending funding requests."
        );

        return true;
      }


      let reply = "💰 Pending Funding:\n\n";

      requests.forEach((r,index)=>{
        reply += `${index+1}. ${r.phone}\n₦${r.amount}\nRef: ${r.reference}\n\n`;
      });


      await sendMessage(phone, reply);

      return true;
    }



    if (text === "withdrawals") {

      const withdrawals = await Withdrawal.find({
        status:"pending"
      }).limit(5);


      if (!withdrawals.length) {

        await sendMessage(
          phone,
          "No pending withdrawals."
        );

        return true;
      }


      let reply = "💸 Pending Withdrawals:\n\n";


      withdrawals.forEach((w,index)=>{
        reply += `${index+1}. ${w.phone}\n₦${w.amount}\n${w.bankName}\n\n`;
      });


      await sendMessage(phone, reply);

      return true;
    }



    if (text === "stats") {

      const users = await User.countDocuments();
      const pendingFunds = await FundingRequest.countDocuments({
        status:"pending"
      });


      await sendMessage(
        phone,
        `📊 AlphaBot Stats\n\nUsers: ${users}\nPending Funding: ${pendingFunds}`
      );


      return true;
    }

  }


  return false;

};


module.exports = {
  handleAdmin
};
