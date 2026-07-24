const express = require("express");
const router = express.Router();

const {
getAirtimePrices,
updateAirtimePrice
} = require("../controllers/adminAirtimeController");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


router.get(
"/",
auth,
admin,
getAirtimePrices
);


router.put(
"/:network",
auth,
admin,
updateAirtimePrice
);


module.exports = router;
