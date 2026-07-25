const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


const {
getAdminTVPlans,
updateTVPlan
} = require("../controllers/adminTVController");



// Get TV plans
router.get(
"/",
auth,
admin,
getAdminTVPlans
);


// Update TV plan
router.put(
"/:id",
auth,
admin,
updateTVPlan
);


module.exports = router;
