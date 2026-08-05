
const express = require("express");
const router = express.Router();

router.get("/", (req,res)=>{
  res.json({
    status:"awake",
    service:"AlphaBot API",
    time:new Date()
  });
});

module.exports = router;
