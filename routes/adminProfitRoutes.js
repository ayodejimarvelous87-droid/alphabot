const express = require("express");
const router = express.Router();

const {
getProfits
}=require("../controllers/adminProfitController");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


router.get(
"/",
auth,
admin,
getProfits
);


module.exports = router;
