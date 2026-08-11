const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  submitRating,
  getMyRating,
  getPublicRatings
} = require("../controllers/ratingController");


// Public ratings
router.get(
  "/public",
  getPublicRatings
);


// Authenticated user's rating
router.get(
  "/mine",
  auth,
  getMyRating
);


// Submit/update authenticated user's rating
router.post(
  "/",
  auth,
  submitRating
);

module.exports = router;
