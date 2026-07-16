const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  registerUser,
  loginUser,
  forgotPassword,
  sendResetOTP,
  verifyResetOTP,
  getProfile,
  updateProfile,
  changePassword
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


module.exports = router;
