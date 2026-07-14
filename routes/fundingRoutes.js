const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  createFundingRequest,
  getFundingRequests,
  approveFunding,
  rejectFunding
} = require("../controllers/fundingController");


// Customer submits funding request
router.post("/request", createFundingRequest);


// Admin only routes
router.get("/requests", auth, admin, getFundingRequests);

router.put("/approve/:id", auth, admin, approveFunding);

router.put("/reject/:id", auth, admin, rejectFunding);


module.exports = router;
