const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  getNotifications,
  markRead,
  markAllRead
} = require("../controllers/notificationController");


// Get user notifications
router.get("/:phone", auth, getNotifications);


// Mark notification as read
router.put("/read/:id", auth, markRead);



// Mark all notifications as read
router.put("/read-all/:phone", auth, markAllRead);

module.exports = router;
