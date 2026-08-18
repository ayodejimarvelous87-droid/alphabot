const jwt = require("jsonwebtoken");

const biometricAuth = (req, res, next) => {

  const token =
    req.headers["x-biometric-token"];

  if (!token) {
    return res.status(401).json({
      message: "Fingerprint authorization required"
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      decoded.type !== "biometric" ||
      !decoded.id ||
      !decoded.phone
    ) {
      return res.status(401).json({
        message: "Invalid fingerprint authorization"
      });
    }

    req.biometricUser = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      message: "Fingerprint authorization expired"
    });

  }

};

module.exports = biometricAuth;
