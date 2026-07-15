const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const startCron = require("./services/cron");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended:false }));

app.use(express.static(path.join(__dirname,"public")));


mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})

.then(()=>{

console.log("MongoDB connected successfully");

startCron();

app.listen(PORT,()=>{

console.log(`AlphaBot API running on port ${PORT}`);

});

})

.catch(error=>{

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
const fundingRoutes = require("./routes/fundingRoutes");
const bankRoutes = require("./routes/bankRoutes");
const whatsappWebhook = require("./whatsapp/webhook");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const referralRoutes = require("./routes/referralRoutes");
const referralEarningsRoutes = require("./routes/referralEarningsRoutes");
const referralWithdrawRoutes = require("./routes/referralWithdrawRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const airtimeRoutes = require("./routes/airtimeRoutes");
const bettingRoutes = require("./routes/bettingRoutes");
const electricityRoutes = require("./routes/electricityRoutes");
const tvRoutes = require("./routes/tvRoutes");
const pinRoutes = require("./routes/pinRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const airtimeCashRoutes = require("./routes/airtimeCashRoutes");
const examPinRoutes = require("./routes/examPinRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const adminExamPinRoutes = require("./routes/adminExamPinRoutes");
const adminAirtimeCashRoutes = require("./routes/adminAirtimeCashRoutes");
const beneficiaryRoutes = require("./routes/beneficiaryRoutes");


// Use routes

app.use("/wallet", walletRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
app.post("/users/test", (req,res)=>{ res.json({message:"users route works"}); });
app.use("/transactions", transactionRoutes);
app.use("/admin", adminRoutes);
app.use("/payment", paymentRoutes);
app.use("/funding", fundingRoutes);
app.use("/bank", bankRoutes);
app.use("/webhook", whatsappWebhook);
app.use("/receipts", receiptRoutes);
app.use("/notifications", notificationRoutes);
app.use("/referrals", referralRoutes);
app.use("/referral-earnings", referralEarningsRoutes);
app.use("/referral-withdraw", referralWithdrawRoutes);
app.use("/maintenance", maintenanceRoutes);
app.use("/airtime", airtimeRoutes);
app.use("/betting", bettingRoutes);
app.use("/electricity", electricityRoutes);
app.use("/tv", tvRoutes);
app.use("/pin", pinRoutes);
app.use("/recurring", recurringRoutes);
app.use("/airtime-cash", airtimeCashRoutes);
app.use("/exam-pin", examPinRoutes);
app.use("/withdrawal", withdrawalRoutes);
app.use("/admin/exam-pin", adminExamPinRoutes);
app.use("/admin/airtime-cash", adminAirtimeCashRoutes);
app.use("/beneficiaries", beneficiaryRoutes);


// Test

app.get("/api",(req,res)=>{

res.send("AlphaBot API is running...");

});


// Server

const PORT = process.env.PORT || 5000;



