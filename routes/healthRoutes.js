const express = require("express");
const router = express.Router();

const startTime = Date.now();
const mongoose = require("mongoose");
const { getRedisStatus } = require("../middleware/rateLimiter");

router.get("/", async(req,res)=>{

  const requestStart = Date.now();

  const mongoStatus =
    mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected";

  const redisStatus = getRedisStatus();

  res.json({

    status:
      mongoStatus === "connected"
      ? "healthy"
      : "degraded",

    database: mongoStatus,

    redis: redisStatus,

    service:"AlphaBot API",

    responseTime: `${Date.now() - requestStart}ms`,

    uptime: `${Math.floor(process.uptime())} seconds`,

      time:new Date()

  });

});

module.exports = router;
