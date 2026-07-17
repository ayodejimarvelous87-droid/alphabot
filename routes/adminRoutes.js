const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  getUsers,
  getWallets,
  getOrders,
  getTransactions,
  getNotifications,
  updateAILimit
} = require("../controllers/adminController");


const {
  adminLogin
} = require("../controllers/adminAuthController");


const {
  searchWallet,
  addFunds,
  deductFunds
} = require("../controllers/adminWalletController");


// Admin login
router.post("/login", adminLogin);


// Protected admin routes
router.get("/users", auth, admin, getUsers);

router.get("/wallets", auth, admin, getWallets);

router.get("/orders", auth, admin, getOrders);

router.get("/transactions", auth, admin, getTransactions);

router.get("/notifications", auth, admin, getNotifications);


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


module.exports = router;
