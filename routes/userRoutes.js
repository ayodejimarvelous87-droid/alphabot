const express = require("express");
const router = express.Router();
const { loginLimiter, loginPhoneLimiter, otpLimiter, otpPhoneLimiter } = require("../middleware/rateLimiter");

const auth = require("../middleware/auth");
const accountTier = require("../middleware/accountTier");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema, otpSchema, emailOtpSchema } = require("../validators/authValidator");
const {
  getMembershipPaymentInfo,
  getMyMembershipPayments
} = require("../controllers/membershipPaymentController");


const {
  registerUser,
  loginUser,
  forgotPassword,
  sendResetOTP,
  verifyResetOTP,
  getProfile,
  updateProfile,
  changePassword,
  logoutUser,
  sendProfileOTP,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  saveWithdrawAccount,
  getWithdrawAccount,
  deleteOwnAccount,
  verifyProfileOTP,
  purchaseMembership,
  getAccountTier,
} = require("../controllers/userController");


// Register
router.post("/register", validate(registerSchema), registerUser);


// Login
router.post(
  "/login",
  validate(loginSchema),
  (req,res,next)=>{
    console.log("USER LOGIN ROUTE HIT");
    loginUser(req,res,next);
  }
);


// Logout from all devices
router.post(
  "/logout",
  auth,
  logoutUser
);


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
router.post("/send-registration-otp", otpLimiter, otpPhoneLimiter, sendRegistrationOTP);

router.post("/verify-registration-otp", otpLimiter, verifyRegistrationOTP);

router.post("/send-profile-otp", otpLimiter, sendProfileOTP);

router.post("/verify-profile-otp", validate(emailOtpSchema), otpLimiter, verifyProfileOTP);


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


// Account tier
router.get(
  "/account-tier",
  auth,
  accountTier,
  getAccountTier
);


// Membership payment information
router.get(
  "/membership/payment-info",
  auth,
  accountTier,
  getMembershipPaymentInfo
);


// My membership payment requests
router.get(
  "/membership/payments",
  auth,
  accountTier,
  getMyMembershipPayments
);


// Membership purchase
router.post(
  "/membership/purchase",
  auth,
  accountTier,
  purchaseMembership
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


// Delete own account
router.delete(
  "/delete-account",
  auth,
  deleteOwnAccount
);

