const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


const {
addExamPin,
bulkAddExamPins,
getExamStock
} = require("../controllers/adminExamPinController");



// Add single PIN
router.post("/", auth, admin, addExamPin);


// Bulk upload PINs
router.post("/bulk", auth, admin, bulkAddExamPins);


// Check stock
router.get("/stock", auth, admin, getExamStock);



module.exports = router;
