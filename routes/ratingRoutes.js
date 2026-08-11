const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  submitRating,
  getMyRating
} = require("../controllers/ratingController");

router.post(
  "/",
  auth,
  submitRating
);

router.get(
  "/mine",
  auth,
  getMyRating
);

module.exports = router;

