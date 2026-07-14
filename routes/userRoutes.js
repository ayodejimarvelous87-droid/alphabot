const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  registerUser,
  loginUser,
  forgotPassword,
  getProfile,
  updateProfile,
  changePassword
} = require("../controllers/userController");


// Register
router.post("/register", registerUser);


// Login
router.post("/login", loginUser);


// Forgot password
router.post("/forgot-password", forgotPassword);


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
