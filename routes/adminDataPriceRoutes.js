const express = require("express");
const router = express.Router();

const {
updateDataPrice,
getDataPrices
} = require("../controllers/adminDataPriceController");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");


router.put(
"/:id",
auth,
admin,
updateDataPrice
);


router.get(
"/",
auth,
admin,
getDataPrices
);


module.exports = router;
