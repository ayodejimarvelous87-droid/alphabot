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
  adjustUserCoins,
  suspendUser,
  activateUser,
  deleteUser,
  upgradeUserToAdmin,
  updateUserAccountTier,
  getUserMembership,
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


router.put(
  "/user/coins/:phone",
  auth,
  admin,
  adjustUserCoins
);

router.put("/user/suspend/:phone", auth, admin, suspendUser);

router.put("/user/activate/:phone", auth, admin, activateUser);

router.put("/user/upgrade/:phone", auth, admin, upgradeUserToAdmin);

router.put(
  "/user/tier/:phone",
  auth,
  admin,
  updateUserAccountTier
);

router.get(
  "/user/membership/:phone",
  auth,
  admin,
  getUserMembership
);

router.put(
  "/user/demote/:phone",
  auth,
  admin,
  demoteUserFromAdmin
);

router.delete("/user/:phone", auth, admin, deleteUser);


router.get("/users", auth, admin, getUsers);

router.get("/wallets", auth, admin, getWallets);

router.get("/orders", auth, admin, getOrders);

router.get("/transactions", auth, admin, getTransactions);

router.get("/notifications", auth, admin, getNotifications);

router.post(
  "/notifications/broadcast",
  auth,
  admin,
  sendBroadcastNotification
);



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



/*
 * Membership management
 */

const {
  getMembershipPaymentRequests,
  approveMembershipPayment,
  rejectMembershipPayment,
  getMembershipPricing,
  updateMembershipPricing
} = require("../controllers/adminMembershipController");

router.get(
  "/membership/payments",
  auth,
  admin,
  getMembershipPaymentRequests
);

router.put(
  "/membership/payments/:id/approve",
  auth,
  admin,
  approveMembershipPayment
);

router.put(
  "/membership/payments/:id/reject",
  auth,
  admin,
  rejectMembershipPayment
);

router.get(
  "/membership/pricing",
  auth,
  admin,
  getMembershipPricing
);

router.put(
  "/membership/pricing",
  auth,
  admin,
  updateMembershipPricing
);

/*
 * Membership payment account
 */

const {
  getBankSettings,
  updateBankSettings
} = require("../controllers/adminBankSettingsController");

router.get(
  "/membership/payment-account",
  auth,
  admin,
  getBankSettings
);

router.put(
  "/membership/payment-account",
  auth,
  admin,
  updateBankSettings
);

module.exports = router;
