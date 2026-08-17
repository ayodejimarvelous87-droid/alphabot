const express = require("express");

const router = express.Router();

const {
getPublicEvents
} = require("../controllers/eventController");


router.get(
"/",
getPublicEvents
);


module.exports = router;
