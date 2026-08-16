const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require("@simplewebauthn/server");

const {
  isoUint8Array
} = require("@simplewebauthn/server/helpers");

const jwt = require("jsonwebtoken");
const auditLogger = require("../services/auditLogger");
const User = require("../models/User");
const normalizePhone = require("../utils/phone");
const BiometricCredential = require("../models/BiometricCredential");
const WebAuthnChallenge = require("../models/WebAuthnChallenge");
const {
  createBiometricAuthorization
} = require("../utils/transactionAuthorization");

const rpName = process.env.WEBAUTHN_RP_NAME || "AlphaBot";

const rpID =
  process.env.WEBAUTHN_RP_ID ||
  "alphabothq.com";

const origin =
  process.env.WEBAUTHN_ORIGIN ||
  "https://alphabothq.com";


const getUser = async (req) => {

  if (!req.user?.id) {
    return null;
  }

  return User.findById(req.user.id);
};


/*
========================================
BIOMETRIC STATUS
========================================
*/

const biometricStatus = async (req, res) => {

  try {

    const user = await getUser(req);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const count =
      await BiometricCredential.countDocuments({
        phone: user.phone
      });

    res.json({
      enabled: count > 0,
      count
    });

  } catch (error) {

    console.error("Biometric status error:", error);

    res.status(500).json({
      message: "Unable to check biometric status"
    });

  }

};


/*
========================================
REGISTER OPTIONS
========================================
*/

const registerOptions = async (req, res) => {

  try {

    const user = await getUser(req);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    const existingCredentials =
      await BiometricCredential.find({
        phone: user.phone
      });


    const options =
      await generateRegistrationOptions({

        rpName,

        rpID,

        userName: user.phone,

        userID:
          isoUint8Array.fromUTF8String(
            `alphabot-${user._id.toString()}`
          ),

        attestationType: "none",

        excludeCredentials:
          existingCredentials.map(
            credential => ({
              id: credential.credentialID,
              transports: credential.transports
            })
          ),

        authenticatorSelection: {

          authenticatorAttachment: "platform",

          residentKey: "required",

          userVerification: "required"

        },

        supportedAlgorithmIDs: [
          -7,
          -257
        ]

      });


    await WebAuthnChallenge.deleteMany({
      phone: user.phone,
      type: "registration"
    });


    await WebAuthnChallenge.create({

      phone: user.phone,

      type: "registration",

      challenge: options.challenge,

      expiresAt:
        new Date(Date.now() + 5 * 60 * 1000)

    });


    res.json(options);

  } catch (error) {

    console.error(
      "Biometric registration options error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to start biometric registration"
    });

  }

};


/*
========================================
VERIFY REGISTRATION
========================================
*/

const registerVerify = async (req, res) => {

  try {

    const user = await getUser(req);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    const challenge =
      await WebAuthnChallenge.findOne({
        phone: user.phone,
        type: "registration"
      }).sort({
        createdAt: -1
      });


    if (!challenge) {

      return res.status(400).json({
        message:
          "Biometric registration expired. Please try again."
      });

    }


    let verification;


    try {

      verification =
        await verifyRegistrationResponse({

          response: req.body,

          expectedChallenge:
            challenge.challenge,

          expectedOrigin: origin,

          expectedRPID: rpID,

          requireUserVerification: true

        });

    } catch (error) {

      console.error(
        "Biometric registration verification:",
        error
      );

      return res.status(400).json({
        message:
          error.message ||
          "Biometric verification failed"
      });

    }


    if (!verification.verified) {

      return res.status(400).json({
        message:
          "Biometric registration was not verified"
      });

    }


    const {
      credential
    } = verification.registrationInfo;


    await BiometricCredential.findOneAndUpdate(

      {
        credentialID:
          credential.id
      },

      {

        phone:
          user.phone,

        credentialID:
          credential.id,

        publicKey:
          Buffer.from(credential.publicKey),

        counter:
          credential.counter,

        transports:
          credential.transports || [],

        lastUsedAt:
          null

      },

      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }

    );


    await WebAuthnChallenge.deleteMany({
      phone: user.phone,
      type: "registration"
    });


    res.json({

      verified: true,

      message:
        "Fingerprint payment enabled successfully"

    });

  } catch (error) {

    console.error(
      "Biometric registration error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to register biometric authentication"
    });

  }

};


/*
========================================
BIOMETRIC LOGIN OPTIONS
========================================
*/

const biometricLoginOptions = async (req, res) => {

  try {

    const cleanPhone = normalizePhone(
      req.body?.phone
    );

    if (!cleanPhone) {
      return res.status(400).json({
        message: "Phone number is required"
      });
    }

    const user = await User.findOne({
      phone: cleanPhone
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.status === "deleted") {
      return res.status(403).json({
        message: "Account deleted"
      });
    }

    const credentials =
      await BiometricCredential.find({
        phone: cleanPhone
      });

    if (!credentials.length) {
      return res.status(400).json({
        message:
          "Fingerprint login is not enabled for this account"
      });
    }

    const options =
      await generateAuthenticationOptions({

        rpID,

        allowCredentials:
          credentials.map(credential => ({

            id:
              credential.credentialID,

            transports:
              credential.transports

          })),

        userVerification:
          "required"

      });

    await WebAuthnChallenge.deleteMany({
      phone: cleanPhone,
      type: "login"
    });

    await WebAuthnChallenge.create({

      phone: cleanPhone,

      type: "login",

      challenge:
        options.challenge,

      expiresAt:
        new Date(Date.now() + 5 * 60 * 1000)

    });

    res.json(options);

  } catch (error) {

    console.error(
      "Biometric login options error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to start fingerprint login"
    });

  }

};


/*
========================================
BIOMETRIC LOGIN VERIFY
========================================
*/

const biometricLoginVerify = async (req, res) => {

  try {

    const cleanPhone = normalizePhone(
      req.body?.phone
    );

    if (!cleanPhone) {
      return res.status(400).json({
        message: "Phone number is required"
      });
    }

    const user = await User.findOne({
      phone: cleanPhone
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.status === "deleted") {
      return res.status(403).json({
        message: "Account deleted"
      });
    }

    const challenge =
      await WebAuthnChallenge.findOne({
        phone: cleanPhone,
        type: "login"
      }).sort({
        createdAt: -1
      });

    if (!challenge) {
      return res.status(400).json({
        message:
          "Fingerprint login expired. Please try again."
      });
    }

    const credential =
      await BiometricCredential.findOne({

        phone:
          cleanPhone,

        credentialID:
          req.body.id

      });

    if (!credential) {
      return res.status(401).json({
        message:
          "Fingerprint credential not found"
      });
    }

    let verification;

    try {

      verification =
        await verifyAuthenticationResponse({

          response:
            req.body,

          expectedChallenge:
            challenge.challenge,

          expectedOrigin:
            origin,

          expectedRPID:
            rpID,

          credential: {

            id:
              credential.credentialID,

            publicKey:
              new Uint8Array(
                credential.publicKey
              ),

            counter:
              credential.counter,

            transports:
              credential.transports

          },

          requireUserVerification:
            true

        });

    } catch (error) {

      console.error(
        "Biometric login verification:",
        error
      );

      return res.status(401).json({
        message:
          error.message ||
          "Fingerprint login failed"
      });

    }

    if (!verification.verified) {

      return res.status(401).json({
        message:
          "Fingerprint login failed"
      });

    }

    credential.counter =
      verification.authenticationInfo.newCounter;

    credential.lastUsedAt =
      new Date();

    await credential.save();

    await WebAuthnChallenge.deleteMany({
      phone: cleanPhone,
      type: "login"
    });

    const token = jwt.sign(
      {
        id: user._id,
        phone: user.phone,
        tokenVersion: user.tokenVersion,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    const safeUser = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      wallet: user.wallet
    };

    await auditLogger({
      actor: user._id.toString(),
      role: user.role,
      action: "USER_BIOMETRIC_LOGIN_SUCCESS",
      target: user.phone,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.json({

      message:
        "Fingerprint login successful",

      token,

      user:
        safeUser

    });

  } catch (error) {

    console.error(
      "Biometric login error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to complete fingerprint login"
    });

  }

};


/*
========================================
AUTHENTICATION OPTIONS
========================================
*/

const authenticationOptions = async (req, res) => {

  try {

    const user = await getUser(req);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    const credentials =
      await BiometricCredential.find({
        phone: user.phone
      });


    if (!credentials.length) {

      return res.status(400).json({
        message:
          "Fingerprint payment is not enabled"
      });

    }


    const options =
      await generateAuthenticationOptions({

        rpID,

        allowCredentials:
          credentials.map(
            credential => ({

              id:
                credential.credentialID,

              transports:
                credential.transports

            })
          ),

        userVerification:
          "required"

      });


    await WebAuthnChallenge.deleteMany({
      phone: user.phone,
      type: "authentication"
    });


    await WebAuthnChallenge.create({

      phone: user.phone,

      type: "authentication",

      challenge:
        options.challenge,

      expiresAt:
        new Date(Date.now() + 5 * 60 * 1000)

    });


    res.json(options);

  } catch (error) {

    console.error(
      "Biometric authentication options error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to start fingerprint authentication"
    });

  }

};


/*
========================================
VERIFY AUTHENTICATION
========================================
*/

const authenticationVerify = async (req, res) => {

  try {

    const user = await getUser(req);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    const challenge =
      await WebAuthnChallenge.findOne({
        phone: user.phone,
        type: "authentication"
      }).sort({
        createdAt: -1
      });


    if (!challenge) {

      return res.status(400).json({
        message:
          "Fingerprint authentication expired. Please try again."
      });

    }


    const credential =
      await BiometricCredential.findOne({

        phone:
          user.phone,

        credentialID:
          req.body.id

      });


    if (!credential) {

      return res.status(400).json({
        message:
          "Fingerprint credential not found"
      });

    }


    let verification;


    try {

      verification =
        await verifyAuthenticationResponse({

          response:
            req.body,

          expectedChallenge:
            challenge.challenge,

          expectedOrigin:
            origin,

          expectedRPID:
            rpID,

          credential: {

            id:
              credential.credentialID,

            publicKey:
              new Uint8Array(
                credential.publicKey
              ),

            counter:
              credential.counter,

            transports:
              credential.transports

          },

          requireUserVerification:
            true

        });

    } catch (error) {

      console.error(
        "Biometric authentication verification:",
        error
      );

      return res.status(401).json({
        message:
          error.message ||
          "Fingerprint authentication failed"
      });

    }


    if (!verification.verified) {

      return res.status(401).json({
        message:
          "Fingerprint authentication failed"
      });

    }


    credential.counter =
      verification.authenticationInfo.newCounter;

    credential.lastUsedAt =
      new Date();

    await credential.save();


    await WebAuthnChallenge.deleteMany({
      phone: user.phone,
      type: "authentication"
    });


    const biometricToken =
      await createBiometricAuthorization(
        user.phone
      );

    res.json({

      verified: true,

      authorization: "biometric",

      biometricToken,

      expiresIn: 300,

      message:
        "Fingerprint verified successfully"

    });

  } catch (error) {

    console.error(
      "Biometric authentication error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to verify fingerprint"
    });

  }

};


/*
========================================
REMOVE BIOMETRIC
========================================
*/

const removeBiometric = async (req, res) => {

  try {

    const user = await getUser(req);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    await BiometricCredential.deleteMany({
      phone: user.phone
    });


    res.json({
      message:
        "Fingerprint payment disabled successfully"
    });

  } catch (error) {

    console.error(
      "Remove biometric error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to disable fingerprint payment"
    });

  }

};


module.exports = {

  biometricStatus,

  biometricLoginOptions,

  biometricLoginVerify,

  registerOptions,

  registerVerify,

  authenticationOptions,

  authenticationVerify,

  removeBiometric

};
