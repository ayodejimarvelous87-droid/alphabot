const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
createEvent,
getEvents,
updateEventStatus,
updateTeamRushTarget,
resetEventLeaderboard
} = require("../controllers/adminEventController");



router.get(
"/",
auth,
admin,
getEvents
);


router.post(
"/",
auth,
admin,
createEvent
);

router.put(
"/:id/status",
auth,
admin,
updateEventStatus
);


router.put(
"/:id/team-rush",
auth,
admin,
updateTeamRushTarget
);



router.post(
"/:id/reset-leaderboard",
auth,
admin,
resetEventLeaderboard
);


module.exports = router;
