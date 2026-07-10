const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const path = require("path");

const app = express();


// Middleware
app.use(express.json());


// Serve website
app.use(express.static(path.join(__dirname, "public")));


// Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });


// Routes
const walletRoutes = require("./routes/walletRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");


// Use routes
app.use("/wallet", walletRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
app.use("/transactions", transactionRoutes);
app.use("/admin", adminRoutes);
app.use("/payment", paymentRoutes);


// API test
app.get("/api", (req, res) => {
  res.send("AlphaBot API is running...");
});


// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AlphaBot API running on port ${PORT}`);
});
