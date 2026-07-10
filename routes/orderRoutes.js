const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  buyProduct,
  orderHistory
} = require("../controllers/orderController");


// Buy product
router.post("/buy", auth, buyProduct);


// View order history
router.get("/:phone", auth, orderHistory);


module.exports = router;
