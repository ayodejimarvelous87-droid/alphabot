const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { purchaseLimiter } = require("../middleware/rateLimiter");

const {
  subscribeTV,
  getTVPlans
} = require("../controllers/tvController");


// Get TV plans
router.get(
  "/plans",
  auth,
  getTVPlans
);


// TV Subscription
router.post(
  "/subscribe",
  auth,
  purchaseLimiter,
  subscribeTV
);


module.exports = router;
