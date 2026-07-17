const express = require("express");
const router = express.Router();

const { buyExamPin } = require("../controllers/examPinController");

router.post("/buy", async (req, res) => {
  return buyExamPin(req, res);
});

module.exports = router;