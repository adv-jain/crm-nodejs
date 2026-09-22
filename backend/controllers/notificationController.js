const mongoose = require("mongoose");

const Notification = require("../models/Notification");

const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// GET ALL NOTIFICATIONS
// ==========================================

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 20, 1),
      100
    );

    const skip = (page - 1) * limit;

    const filter = {
      recipient: userId
    };

    // ?unread=true
    if (req.query.unread === "true") {
      filter.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate("relatedLead", "firstName lastName")
        .populate("relatedContact", "firstName lastName")
        .populate("relatedTask", "title status priority")
        .populate("relatedDeal", "title value stage")
        .populate("relatedCustomer", "status customerSince")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(filter)
    ]);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    return res.status(200).json({
      message: "Notifications fetched successfully",
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
};

// ==========================================
// GET SINGLE NOTIFICATION
// ==========================================

const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user.id
    })
      .populate("relatedLead", "firstName lastName")
      .populate("relatedContact", "firstName lastName")
      .populate("relatedTask", "title status priority")
      .populate("relatedDeal", "title value stage")
      .populate("relatedCustomer", "status customerSince");

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      message: "Notification fetched successfully",
      notification
    });
  } catch (error) {
    console.error("Get notification error:", error);

    return res.status(500).json({
      message: "Failed to fetch notification",
      error: error.message
    });
  }
};

// ==========================================
// UNREAD COUNT
// ==========================================

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    return res.status(200).json({
      count
    });
  } catch (error) {
    console.error("Unread count error:", error);

    return res.status(500).json({
      message: "Failed to get unread count",
      error: error.message
    });
  }
};

// ==========================================
// MARK SINGLE AS READ
// ==========================================

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: req.user.id
      },
      {
        $set: {
          isRead: true
        }
      },
      {
        new: true
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message
    });
  }
};

// ==========================================
// MARK ALL AS READ
// ==========================================

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user.id,
        isRead: false
      },
      {
        $set: {
          isRead: true
        }
      }
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      message: "Failed to mark all notifications as read",
      error: error.message
    });
  }
};

// ==========================================
// DELETE NOTIFICATION
// ==========================================

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    return res.status(500).json({
      message: "Failed to delete notification",
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};