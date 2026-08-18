const axios = require("axios");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const FLUTTERWAVE_URL =
  "https://api.flutterwave.com/v3/virtual-account-numbers";

async function createPermanentVirtualAccount({
  userId,
  bvn
}) {

  if (!userId) {
    throw new AppError("User is required", 400);
  }

    if (!bvn) {
      throw new AppError("BVN is required", 400);
    }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Never create another account if the user already has one.
  if (
    user.virtualAccountNumber &&
    user.virtualAccountStatus === "active"
  ) {
    return {
      existing: true,
      account: {
        accountNumber: user.virtualAccountNumber,
        bankName: user.virtualAccountBankName,
        bankCode: user.virtualAccountBankCode,
        accountName: user.virtualAccountName,
        status: user.virtualAccountStatus
      }
    };
  }

  const payload = {
    email: user.email,
    tx_ref: `ALPHABOT-PVA-${user._id}-${Date.now()}`,
    is_permanent: true,
    account_type: "static",
    amount: 0,
    currency: "NGN",
    firstname: user.name?.split(" ")[0] || "AlphaBot",
    lastname:
      user.name?.split(" ").slice(1).join(" ") || "User",
    phonenumber: user.phone
  };

    // Send the supplied BVN to Flutterwave.
    // BVN is never stored in the User document.
    payload.bvn = String(bvn).trim();

  try {

    const response = await axios.post(
      FLUTTERWAVE_URL,
      payload,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data?.data;

    if (!data) {
      throw new AppError(
        "Flutterwave did not return virtual account details",
        502
      );
    }

    const accountNumber =
      data.account_number ||
      data.accountNumber;

    if (!accountNumber) {
      throw new AppError(
        "Flutterwave virtual account number was not returned",
        502
      );
    }

    // Store ONLY the virtual-account details.
    // BVN is intentionally never persisted.
    user.virtualAccountId =
      data.id ||
      data.account_id ||
      data.virtual_account_id ||
      null;

    user.virtualAccountReference =
      payload.tx_ref;

    user.virtualAccountNumber =
      accountNumber;

    user.virtualAccountBankName =
      data.bank_name ||
      data.bank?.name ||
      null;

    user.virtualAccountBankCode =
      data.bank_code ||
      data.bank?.code ||
      null;

    user.virtualAccountName =
      data.account_name ||
      data.accountName ||
      user.name;

    user.virtualAccountStatus = "active";

    user.virtualAccountCreatedAt = new Date();

    await user.save();

    return {
      existing: false,
      account: {
        accountNumber:
          user.virtualAccountNumber,

        bankName:
          user.virtualAccountBankName,

        bankCode:
          user.virtualAccountBankCode,

        accountName:
          user.virtualAccountName,

        status:
          user.virtualAccountStatus
      }
    };

  } catch (error) {

    // Do not log the request payload.
    // It may contain BVN.
    console.error(
      "Virtual account creation failed:",
      error.response?.data?.message ||
      error.message
    );

    throw new AppError(
      error.response?.data?.message ||
      "Unable to create virtual account",
      error.response?.status >= 400 &&
      error.response?.status < 500
        ? error.response.status
        : 502
    );
  }
}

module.exports = {
  createPermanentVirtualAccount
};
