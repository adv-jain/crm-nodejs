const express = require("express");

const {
  getNotifications,
  getNotificationById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/unread-count",
  protect,
  authorize("admin", "manager", "sales"),
  getUnreadCount
);

router.get(
  "/",
  protect,
  authorize("admin", "manager", "sales"),
  getNotifications
);

router.get(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  getNotificationById
);

router.put(
  "/:id/read",
  protect,
  authorize("admin", "manager", "sales"),
  markAsRead
);

router.put(
  "/read-all",
  protect,
  authorize("admin", "manager", "sales"),
  markAllAsRead
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  deleteNotification
);

module.exports = router;