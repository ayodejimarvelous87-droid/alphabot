const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

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
  subscribeTV
);


module.exports = router;
