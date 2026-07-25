const express = require("express");
const router = express.Router();

const {
getDashboard
} = require("../controllers/adminDashboardController");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.get(
"/",
auth,
admin,
getDashboard
);

module.exports = router;
