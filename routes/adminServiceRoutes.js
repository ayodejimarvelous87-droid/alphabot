const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
getServiceSettings,
updateService
} = require("../controllers/adminServiceController");


// View all service settings
router.get(
"/",
auth,
admin,
getServiceSettings
);


// Update electricity settings
router.put(
"/electricity",
auth,
admin,
updateService
);


// Update TV settings
router.put(
"/tv",
auth,
admin,
updateService
);


// Update betting settings
router.put(
"/betting",
auth,
admin,
updateService
);


// Update recurring settings
router.put(
"/recurring",
auth,
admin,
updateService
);


module.exports = router;
