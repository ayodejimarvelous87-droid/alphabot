const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { getRedisStatus } = require("../middleware/rateLimiter");

router.get("/", (req,res)=>{

  const mongoStatus =
    mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected";

  res.json({

    status:
      mongoStatus === "connected"
      ? "healthy"
      : "degraded",

    database: mongoStatus,

    redis: getRedisStatus(),

    service:"AlphaBot API",

    time:new Date()

  });

});

module.exports = router;
