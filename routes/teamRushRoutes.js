const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  getTeamRush,
  joinTeamRush
} = require("../controllers/teamRushController");


router.get(
  "/",
  auth,
  getTeamRush
);


router.post(
  "/join",
  auth,
  joinTeamRush
);


module.exports = router;
