const Wallet = require("../models/wallet");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");

const { purchaseProduct } = require("../services/vtuService");


// Buy product
const buyProduct = async (req, res) => {
  try {

    const { phone, productId } = req.body;

    console.log("Token:", req.user);
    console.log("Phone:", phone);


    if (req.user.phone !== phone) {
      return res.status(403).json({
        message: "Unauthorized order access"
      });
    }


    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }


    const wallet = await Wallet.findOne({ phone });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }


    if (wallet.balance < product.price) {
      return res.status(400).json({
        message: "Insufficient wallet balance"
      });
    }


    const vtuResponse = await purchaseProduct(phone, product);


    if (!vtuResponse.success) {
      return res.status(400).json({
        message: vtuResponse.message
      });
    }


    wallet.balance -= product.price;

    await wallet.save();


    const order = await Order.create({
      phone,
      productId: product._id,
      productName: product.name,
      amount: product.price,
      status: "successful"
    });


    await Transaction.create({
      phone,
      type: "purchase",
      amount: product.price,
      description: product.name,
      status: "successful"
    });


    res.json({
      message: "Purchase successful",
      order,
      wallet,
      vtuResponse
    });


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



// Order history
const orderHistory = async (req, res) => {

  try {

    const { phone } = req.params;


    console.log("Token:", req.user);
    console.log("Phone:", phone);


    if (req.user.phone !== phone) {
      return res.status(403).json({
        message: "Unauthorized order access"
      });
    }


    const orders = await Order.find({ phone });


    res.json(orders);


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};



module.exports = {
  buyProduct,
  orderHistory
};
