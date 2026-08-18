const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const TransactionPin = require("../models/TransactionPin");
const BiometricAuthorization = require("../models/BiometricAuthorization");

const SECRET =
  process.env.JWT_SECRET;

const createBiometricAuthorization = async (phone) => {

  const token = crypto.randomBytes(32).toString("hex");

  await BiometricAuthorization.create({
    token,
    phone,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  return jwt.sign(
    {
      type: "biometric_transaction",
      token,
      phone
    },
    SECRET,
    {
      expiresIn: "5m"
    }
  );
};


const verifyTransactionAuthorization = async ({
  phone,
  pin,
  biometricToken
}) => {

  /*
   * FINGERPRINT
   */

  if (biometricToken) {

    let decoded;

    try {

      decoded = jwt.verify(
        biometricToken,
        SECRET
      );

    } catch (error) {

      return false;

    }

    if (
      decoded.type !== "biometric_transaction" ||
      decoded.phone !== phone
    ) {

      return false;

    }

    const authorization =
      await BiometricAuthorization.findOne({
        token: decoded.token,
        phone
      });

    if (!authorization) {
      return false;
    }

    /*
     * Single-use authorization.
     * Delete before returning success.
     */

    await BiometricAuthorization.deleteOne({
      _id: authorization._id
    });

    return true;
  }


  /*
   * EXISTING PIN
   */

  if (!pin) {
    return false;
  }

  const userPin =
    await TransactionPin.findOne({
      phone
    });

  if (!userPin) {
    return false;
  }

  return bcrypt.compare(
    pin,
    userPin.pin
  );
};


module.exports = {
  createBiometricAuthorization,
  verifyTransactionAuthorization
};
