const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
buyEPin
} = require("../controllers/ePinController");


router.post(
"/buy",
auth,
buyEPin
);


module.exports = router;
