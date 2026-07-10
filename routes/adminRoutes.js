const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  getUsers,
  getWallets,
  getOrders,
  getTransactions
} = require("../controllers/adminController");


// Admin dashboard data
router.get("/users", auth, admin, getUsers);

router.get("/wallets", auth, admin, getWallets);

router.get("/orders", auth, admin, getOrders);

router.get("/transactions", auth, admin, getTransactions);


module.exports = router;
