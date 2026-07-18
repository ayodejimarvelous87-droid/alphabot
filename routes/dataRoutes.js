const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
buyData
} = require("../controllers/dataController");


// Buy data

router.post(
"/buy",
auth,
buyData
);


module.exports = router;
