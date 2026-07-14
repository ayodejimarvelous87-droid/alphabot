const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


// Admin only - add product
router.post("/add", auth, admin, addProduct);


// Public - customers view products
router.get("/", getProducts);


// Admin only - update product
router.put("/:id", auth, admin, updateProduct);


// Admin only - delete product
router.delete("/:id", auth, admin, deleteProduct);


module.exports = router;
