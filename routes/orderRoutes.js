const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const maintenance = require("../middleware/maintenance");


const {
  buyProduct,
  orderHistory
} = require("../controllers/orderController");


// Buy product (blocked during maintenance)
router.post(
  "/buy",
  auth,
  maintenance,
  buyProduct
);


// View order history
router.get(
  "/:phone",
  auth,
  orderHistory
);


module.exports = router;
