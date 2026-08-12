require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const { generalLimiter } = require("./middleware/rateLimiter");
const helmet = require("helmet");
const xss = require("xss");

const startCron = require("./services/cron");
const startOTPCleanup = require("./services/otpCleanup");
const { startFlutterwaveCron } = require("./services/flutterwaveCron");
const { startBlogPayoutReminderCron } = require("./services/blogPayoutReminderCron");
const { startBlogCommissionUnlockCron } = require("./services/blogCommissionUnlockCron");
const { connectRedis } = require("./services/redisService");
require("./services/recurringService");
const path = require("path");

const emailTestRoutes = require("./routes/emailTestRoutes");
const errorHandler = require("./middleware/errorHandler");
const app = express();

app.disable("x-powered-by");

app.set("trust proxy", 1);

// Global API rate protection
app.use(generalLimiter);

app.use(helmet());


// CORS
app.use(cors({
  origin: [
    "https://alphabot-frontend-chi.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
  ],
  credentials: true
}));


app.use(express.json({
  limit:"10kb",
  verify:(req,res,buf)=>{
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended:false }));

// NoSQL injection protection
app.use((req,res,next)=>{

  if(req.body){
    req.body = mongoSanitize.sanitize(req.body);
  }

  if(req.params){
    req.params = mongoSanitize.sanitize(req.params);
  }

  next();

});

// XSS protection
const cleanXSS = (data)=>{
  if(!data) return data;

  return JSON.parse(
    JSON.stringify(data),
    (key,value)=>{
      if(typeof value === "string"){
        return xss(value);
      }

      return value;
    }
  );
};


app.use((req,res,next)=>{

  if(req.body){
    req.body = cleanXSS(req.body);
  }


  if(req.params){
    req.params = cleanXSS(req.params);
  }


  if(req.query && Object.keys(req.query).length){

    for(const key of Object.keys(req.query)){

      if(typeof req.query[key] === "string"){
        req.query[key] = xss(req.query[key]);
      }

    }

  }


  next();

});

app.use(express.static(path.join(__dirname,"public")));


// Routes

const walletRoutes = require("./routes/walletRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const twoFactorRoutes = require("./routes/twoFactorRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const fundingRoutes = require("./routes/fundingRoutes");
const bankRoutes = require("./routes/bankRoutes");
const whatsappWebhook = require("./whatsapp/webhook");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const maintenance = require("./middleware/maintenance");
const referralRoutes = require("./routes/referralRoutes");
const referralEarningsRoutes = require("./routes/referralEarningsRoutes");
const referralWithdrawRoutes = require("./routes/referralWithdrawRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const airtimeRoutes = require("./routes/airtimeRoutes");
const dataRoutes = require("./routes/dataRoutes");
const dataPlanRoutes = require("./routes/dataPlanRoutes");
const bettingRoutes = require("./routes/bettingRoutes");
const electricityRoutes = require("./routes/electricityRoutes");
const tvRoutes = require("./routes/tvRoutes");
const pinRoutes = require("./routes/pinRoutes");
const biometricRoutes = require("./routes/biometricRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const airtimeCashRoutes = require("./routes/airtimeCashRoutes");
const examPinRoutes = require("./routes/examPinRoutes");
const whatsappExamRoutes = require("./routes/whatsappExamRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const adminExamPinRoutes = require("./routes/adminExamPinRoutes");
const adminWithdrawalRoutes = require("./routes/adminWithdrawalRoutes");
const adminAirtimeCashRoutes = require("./routes/adminAirtimeCashRoutes");
const beneficiaryRoutes = require("./routes/beneficiaryRoutes");
const vtuRoutes = require("./routes/vtuRoutes");
const transferRoutes = require("./routes/transferRoutes");
const aiRoutes = require("./routes/aiRoutes");
const footballRoutes = require("./routes/footballRoutes");
const footballPredictionRoutes = require("./routes/footballPredictionRoutes");
const footballRewardRoutes = require("./routes/footballRewardRoutes");
const footballChatRoutes = require("./routes/footballChatRoutes");
const ePinRoutes = require("./routes/ePinRoutes");
const footballAdminRoutes = require("./routes/footballAdminRoutes");
const adminDataPriceRoutes = require("./routes/adminDataPriceRoutes");
const adminAirtimeRoutes = require("./routes/adminAirtimeRoutes");
const adminProfitRoutes = require("./routes/adminProfitRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminServiceRoutes = require("./routes/adminServiceRoutes");
const adminTVRoutes = require("./routes/adminTVRoutes");
const adminElectricityRoutes = require("./routes/adminElectricityRoutes");
const adminBettingRoutes = require("./routes/adminBettingRoutes");
const adminRecurringRoutes = require("./routes/adminRecurringRoutes");
const adminTransferRoutes = require("./routes/adminTransferRoutes");
const transferSettingsRoutes = require("./routes/transferSettingsRoutes");
const flutterwaveRoutes = require("./routes/flutterwaveRoutes");
const blogPartnerRoutes = require("./routes/blogPartnerRoutes");
const blogPayoutRoutes = require("./routes/blogPayoutRoutes");
const wakeRoutes = require("./routes/wakeRoutes");
const healthRoutes = require("./routes/healthRoutes");



// Global API freeze protection
app.use((req,res,next)=>{

  const allowedPaths = [
    "/flutterwave/webhook",
    "/vtu/webhook",
    "/maintenance",
    "/health",
    "/wake",
    "/health",
    "/wake"
  ];

  if(
    allowedPaths.some(path => req.originalUrl.startsWith(path))
  ){
    return next();
  }

  maintenance(req,res,next);

});

// Use routes

app.use("/football", footballRoutes);
app.use("/football", footballPredictionRoutes);
app.use("/football/rewards", footballRewardRoutes);
app.use("/football/chat", footballChatRoutes);
app.use("/football/admin", footballAdminRoutes);
app.use("/ai", aiRoutes);
app.use("/test-email", emailTestRoutes);
app.use("/wallet", walletRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

app.use("/users", userRoutes);
app.use("/2fa", twoFactorRoutes);
app.use("/ratings", ratingRoutes);

app.post("/users/test",(req,res)=>{
  res.json({
    message:"users route works"
  });
});

app.use("/transactions", transactionRoutes);
app.use("/admin/withdrawal", adminWithdrawalRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/data-prices", adminDataPriceRoutes);
app.use("/admin/airtime-prices", adminAirtimeRoutes);
app.use("/admin/profits", adminProfitRoutes);
app.use("/admin/services", adminServiceRoutes);
app.use("/admin/tv-plans", adminTVRoutes);
app.use("/admin/betting-settings", adminBettingRoutes);
app.use("/admin/recurring", adminRecurringRoutes);
app.use("/admin/transfer-settings", adminTransferRoutes);
app.use("/admin/electricity-settings", adminElectricityRoutes);
app.use("/admin/dashboard", adminDashboardRoutes);
app.use("/funding", fundingRoutes);
app.use("/flutterwave", flutterwaveRoutes);
app.use("/bank", bankRoutes);
app.use("/transfer/settings", transferSettingsRoutes);
app.use("/webhook", whatsappWebhook);

app.use("/receipts", receiptRoutes);
app.use("/notifications", notificationRoutes);

app.use("/referrals", referralRoutes);
app.use("/referral-earnings", referralEarningsRoutes);
app.use("/referral-withdraw", referralWithdrawRoutes);

app.use("/maintenance", maintenanceRoutes);



app.use("/airtime", airtimeRoutes);
app.use("/data", dataRoutes);
app.use("/data", dataPlanRoutes);
app.use("/vtu", vtuRoutes);
app.use("/betting", bettingRoutes);
app.use("/electricity", electricityRoutes);
app.use("/tv", tvRoutes);

app.use("/pin", pinRoutes);
app.use("/biometric", biometricRoutes);
app.use("/recurring", recurringRoutes);

app.use("/airtime-cash", airtimeCashRoutes);
app.use("/whatsapp-exam", whatsappExamRoutes);
app.use("/exam-pin", examPinRoutes);

app.use("/withdrawal", withdrawalRoutes);
app.use("/settings", settingsRoutes);

app.use("/admin/exam-pin", adminExamPinRoutes);
app.use("/admin/airtime-cash", adminAirtimeCashRoutes);

app.use("/epin", ePinRoutes);
app.use("/transfer", transferRoutes);
app.use("/blog-partner", blogPartnerRoutes);
app.use("/blog-payout", blogPayoutRoutes);
app.use("/wake", wakeRoutes);
app.use("/health", healthRoutes);
app.use("/beneficiary", beneficiaryRoutes);


// Test

app.get("/api",(req,res)=>{
  res.send("AlphaBot API is running...");
});


// Error handler (must be after all routes)
app.use(errorHandler);


// Database + Server

const PORT = process.env.PORT || 5000;


mongoose.connect(process.env.MONGO_URI,{
  serverSelectionTimeoutMS:5000
})

.then(()=>{

  console.log("MongoDB connected successfully");

  startCron();
  startOTPCleanup();
  startFlutterwaveCron();
  startBlogPayoutReminderCron();
  startBlogCommissionUnlockCron();
  connectRedis();



  
app.listen(PORT,()=>{

    console.log(`AlphaBot API running on port ${PORT}`);

  });


})

.catch(error=>{

  console.log("MongoDB connection error:",error);

});
