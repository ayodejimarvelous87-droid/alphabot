const express = require("express");
const router = express.Router();

const { buyData } = require("../controllers/vtuController");

router.post("/buy-data", buyData);

module.exports = router;