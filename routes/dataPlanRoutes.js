const express = require("express");

const router = express.Router();

const {
getDataPlans
} = require("../controllers/dataPlanController");

router.get(
"/plans",
getDataPlans
);


module.exports = router;
