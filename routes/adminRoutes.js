const express = require("express");
const router = express.Router();

const { loginLimiter, otpLimiter } = require("../middleware/rateLimiter");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  getUsers,
  getWallets,
  getOrders,
  getTransactions,
  getNotifications,
  updateAILimit,
  updateFootballSettings,
  updatePricingSettings,
  getUserDetails,
  suspendUser,
  activateUser,
  deleteUser,
  upgradeUserToAdmin,
  demoteUserFromAdmin,
  sendBroadcastNotification,
  updateSystemSettings
} = require("../controllers/adminController");


const {
  adminLogin,
  verifyAdminOTP
} = require("../controllers/adminAuthController");


const {
  searchWallet,
  addFunds,
  deductFunds
} = require("../controllers/adminWalletController");


// Admin login
router.post("/login", loginLimiter, adminLogin);

// Verify admin OTP
router.post("/verify-otp", otpLimiter, verifyAdminOTP);


// Protected admin routes

router.get("/user/:phone", auth, admin, getUserDetails);

router.put("/user/suspend/:phone", auth, admin, suspendUser);

router.put("/user/activate/:phone", auth, admin, activateUser);

router.put("/user/upgrade/:phone", auth, admin, upgradeUserToAdmin);

router.put("/user/demote/:phone", auth, admin, demoteUserFromAdmin,
  sendBroadcastNotification);
  updateSystemSettings

router.delete("/user/:phone", auth, admin, deleteUser);


router.get("/users", auth, admin, getUsers);

router.get("/wallets", auth, admin, getWallets);

router.get("/orders", auth, admin, getOrders);

router.get("/transactions", auth, admin, getTransactions);

router.get("/notifications", auth, admin, getNotifications);

router.post("/notifications/broadcast", auth, admin, sendBroadcastNotification);
  updateSystemSettings



// Wallet management

router.get(
  "/wallet/:phone",
  auth,
  admin,
  searchWallet
);


router.post(
  "/wallet/add",
  auth,
  admin,
  addFunds
);


router.post(
  "/wallet/deduct",
  auth,
  admin,
  deductFunds
);


// AI management

router.put(
  "/ai-limit",
  auth,
  admin,
  updateAILimit
);


router.put(
  "/football-settings",
  auth,
  admin,
  updateFootballSettings
);


router.put(
  "/pricing-settings",
  auth,
  admin,
  updatePricingSettings
);

router.put(
  "/system-settings",
  auth,
  admin,
  updateSystemSettings
);


module.exports = router;
