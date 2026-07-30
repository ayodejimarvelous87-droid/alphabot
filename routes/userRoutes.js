const express = require("express");
const router = express.Router();
const { loginLimiter, otpLimiter } = require("../middleware/rateLimiter");

const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema, otpSchema } = require("../validators/authValidator");
const {
  registerUser,
  loginUser,
  forgotPassword,
  sendResetOTP,
  verifyResetOTP,
  getProfile,
  updateProfile,
  changePassword,
  sendProfileOTP,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  saveWithdrawAccount,
  getWithdrawAccount,
  verifyProfileOTP,
} = require("../controllers/userController");


// Register
router.post("/register", validate(registerSchema), registerUser);


// Login
router.post("/login", validate(loginSchema), loginLimiter, (req,res,next)=>{ console.log("USER LOGIN ROUTE HIT"); loginUser(req,res,next); });


// Forgot password
router.post("/forgot-password", forgotPassword);


// Send reset OTP
router.post(
"/send-reset-otp",
otpLimiter,
sendResetOTP
);


// Verify reset OTP
router.post(
"/verify-reset-otp",
otpLimiter,
verifyResetOTP
);



// Profile verification OTP
// Registration OTP
router.post("/send-registration-otp", otpLimiter, sendRegistrationOTP);

router.post("/verify-registration-otp", otpLimiter, verifyRegistrationOTP);

router.post("/send-profile-otp", otpLimiter, sendProfileOTP);

router.post("/verify-profile-otp", validate(otpSchema), otpLimiter, verifyProfileOTP);


// User profile
router.get(
  "/profile/:phone",
  auth,
  getProfile
);


// Update profile
router.put(
  "/profile/:phone",
  auth,
  updateProfile
);


// Change password
router.put(
  "/change-password/:phone",
  auth,
  changePassword
);



// Withdrawal saved account
router.post(
  "/withdraw-account",
  auth,
  saveWithdrawAccount
);

router.get(
  "/withdraw-account/:phone",
  auth,
  getWithdrawAccount
);


module.exports = router;
