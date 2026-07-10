const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");


// Add product
router.post("/add", addProduct);


// Get products
router.get("/", getProducts);


// Update product
router.put("/:id", updateProduct);


// Delete product
router.delete("/:id", deleteProduct);


module.exports = router;