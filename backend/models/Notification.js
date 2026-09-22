const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        "LEAD_ASSIGNED",
        "LEAD_CONVERTED",
        "CONTACT_ASSIGNED",
        "TASK_ASSIGNED",
        "TASK_COMPLETED",
        "DEAL_ASSIGNED",
        "DEAL_WON",
        "DEAL_LOST",
        "CUSTOMER_CREATED"
      ],
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true
    },

    relatedLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null
    },

    relatedContact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null
    },

    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null
    },

    relatedDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null
    },

    relatedCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1
});

notificationSchema.index({
  recipient: 1,
  createdAt: -1
});

module.exports = mongoose.model("Notification", notificationSchema);