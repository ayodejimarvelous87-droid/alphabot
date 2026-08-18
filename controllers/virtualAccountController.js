const AppError = require("../utils/AppError");
const User = require("../models/User");
const {
  createPermanentVirtualAccount
} = require("../services/virtualAccountService");


const createVirtualAccount = async (req, res, next) => {

  try {

      const { bvn } = req.body;

      if (!bvn) {
        throw new AppError(
          "BVN is required",
          400
        );
      }

      const result =
        await createPermanentVirtualAccount({
          userId: req.user.id,
          bvn
        });

    res.status(result.existing ? 200 : 201).json({
      success: true,
      message: result.existing
        ? "Virtual account already exists"
        : "Permanent virtual account created",
      account: result.account
    });

  } catch (error) {
    next(error);
  }
};


const getVirtualAccount = async (req, res, next) => {

  try {

    const user = await User.findById(req.user.id).select(
      "virtualAccountId virtualAccountNumber virtualAccountBankName virtualAccountBankCode virtualAccountName virtualAccountStatus virtualAccountCreatedAt"
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.virtualAccountNumber) {
      return res.json({
        success: true,
        exists: false,
        account: null
      });
    }

    res.json({
      success: true,
      exists: true,
      account: {
        accountNumber: user.virtualAccountNumber,
        bankName: user.virtualAccountBankName,
        bankCode: user.virtualAccountBankCode,
        accountName: user.virtualAccountName,
        status: user.virtualAccountStatus,
        createdAt: user.virtualAccountCreatedAt
      }
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  createVirtualAccount,
  getVirtualAccount
};
