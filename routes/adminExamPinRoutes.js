const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


const {
addExamPin,
getExamStock
} = require("../controllers/adminExamPinController");



// Add PIN stock
router.post("/", auth, admin, addExamPin);


// Check stock
router.get("/stock", auth, admin, getExamStock);



module.exports = router;
