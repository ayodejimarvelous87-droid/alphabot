const express = require("express");
const router = express.Router();
const { loginLimiter, otpLimiter } = require("../middleware/rateLimiter");

const auth = require("../middleware/auth");
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
  verifyProfileOTP,
  saveWithdrawAccount,
  getWithdrawAccount
} = require("../controllers/userController");


// Register
router.post("/register", registerUser);


// Login
router.post("/login", (req,res,next)=>{ console.log("USER LOGIN ROUTE HIT"); loginUser(req,res,next); });


// Forgot password
router.post("/forgot-password", forgotPassword);


// Send reset OTP
router.post(
"/send-reset-otp",
sendResetOTP
);


// Verify reset OTP
router.post(
"/verify-reset-otp",
verifyResetOTP
);



// Profile verification OTP
// Registration OTP
router.post("/send-registration-otp", sendRegistrationOTP);

router.post("/verify-registration-otp", verifyRegistrationOTP);

router.post("/send-profile-otp", sendProfileOTP);

router.post("/verify-profile-otp", verifyProfileOTP);
      saveWithdrawAccount,
      getWithdrawAccount


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
