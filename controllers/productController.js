const Product = require("../models/Product");


// Add product
const addProduct = async (req, res) => {
  try {
    const {
      network,
      name,
      type,
      price,
      validity,
      providerCode
    } = req.body;


    const product = await Product.create({
      network,
      name,
      type,
      price,
      validity,
      providerCode
    });


    res.json({
      message: "Product added successfully",
      product
    });


  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



// Get all products
const getProducts = async (req, res) => {
  try {

    const products = await Product.find({ status: "active" });

    res.json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



// Update product
const updateProduct = async (req, res) => {
  try {

    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true
      }
    );


    res.json({
      message: "Product updated successfully",
      product
    });


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



// Delete product
const deleteProduct = async (req, res) => {
  try {

    const { id } = req.params;

    await Product.findByIdAndDelete(id);


    res.json({
      message: "Product deleted successfully"
    });


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
};