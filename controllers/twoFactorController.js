const User = require("../models/User");
const {
  TOTP,
  NobleCryptoPlugin,
  ScureBase32Plugin
} = require("otplib");
const QRCode = require("qrcode");
const AppError = require("../utils/AppError");

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin()
});

const SENSITIVE_ACTIONS = [
  "change_password",
  "change_security"
];

const getTwoFactorStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) throw new AppError("User not found", 404);

    res.json({
      enabled: !!user.twoFactorEnabled,
      verifiedAt: user.twoFactorVerifiedAt || null
    });
  } catch (error) {
    next(error);
  }
};

const setupTwoFactor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("+twoFactorSecret");

    if (!user) throw new AppError("User not found", 404);

    if (user.twoFactorEnabled) {
      throw new AppError("2FA is already enabled", 400);
    }

    if (!user.email) {
      throw new AppError(
        "An email address is required for 2FA setup",
        400
      );
    }

    if (!user.emailVerified) {
      throw new AppError(
        "Please verify your email before enabling 2FA",
        400
      );
    }

    const secret = totp.generateSecret();

    const uri = totp.toURI({
      issuer: "AlphaBot",
      label: user.email,
      secret
    });

    const qrCode = await QRCode.toDataURL(uri);

    user.twoFactorSecret = secret;
    await user.save();

    res.json({
      message: "2FA setup generated successfully",
      qrCode,
      secret
    });
  } catch (error) {
    next(error);
  }
};

const verifyTwoFactorSetup = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      throw new AppError(
        "Authenticator code is required",
        400
      );
    }

    const user = await User.findById(req.user.id)
      .select("+twoFactorSecret");

    if (!user) throw new AppError("User not found", 404);

    if (user.twoFactorEnabled) {
      throw new AppError("2FA is already enabled", 400);
    }

    if (!user.twoFactorSecret) {
      throw new AppError(
        "2FA setup has not been started",
        400
      );
    }

    const result = await totp.verify(code, { secret: user.twoFactorSecret });

    if (!result.valid) {
      throw new AppError(
        "Invalid authenticator code",
        400
      );
    }

    user.twoFactorEnabled = true;
    user.twoFactorVerifiedAt = new Date();

    await user.save();

    res.json({
      message: "2FA enabled successfully"
    });
  } catch (error) {
    next(error);
  }
};

const verifyTwoFactor = async (req, res, next) => {
  try {
    const { action, code } = req.body;

    if (!SENSITIVE_ACTIONS.includes(action)) {
      throw new AppError("Invalid 2FA action", 400);
    }

    if (!code) {
      throw new AppError(
        "Authenticator code is required",
        400
      );
    }

    const user = await User.findById(req.user.id)
      .select("+twoFactorSecret");

    if (!user) throw new AppError("User not found", 404);

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError(
        "2FA is not enabled",
        400
      );
    }

    const result = await totp.verify(code, { secret: user.twoFactorSecret });

    if (!result.valid) {
      throw new AppError(
        "Invalid authenticator code",
        400
      );
    }

    res.json({
      message: "2FA verification successful",
      action
    });
  } catch (error) {
    next(error);
  }
};

const disableTwoFactor = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      throw new AppError(
        "Authenticator code is required",
        400
      );
    }

    const user = await User.findById(req.user.id)
      .select("+twoFactorSecret");

    if (!user) throw new AppError("User not found", 404);

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError(
        "2FA is not enabled",
        400
      );
    }

    const result = await totp.verify(code, { secret: user.twoFactorSecret });

    if (!result.valid) {
      throw new AppError(
        "Invalid authenticator code",
        400
      );
    }

    user.twoFactorEnabled = false;
    user.twoFactorVerifiedAt = null;
    user.twoFactorSecret = null;

    await user.save();

    res.json({
      message: "2FA disabled successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTwoFactorStatus,
  setupTwoFactor,
  verifyTwoFactorSetup,
  verifyTwoFactor,
  disableTwoFactor
};
