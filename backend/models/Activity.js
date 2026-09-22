const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "Call",
        "Email",
        "Meeting",
        "Note",
        "Follow-up",
        "Demo",
        "WhatsApp",
        "Other"
      ],
      required: [true, "Activity type is required"]
    },

    title: {
      type: String,
      required: [true, "Activity title is required"],
      trim: true,
      minlength: 2,
      maxlength: 150
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: ""
    },

    activityDate: {
      type: Date,
      default: Date.now
    },

    outcome: {
      type: String,
      enum: [
        "Positive",
        "Neutral",
        "Negative",
        "No Response",
        "Completed",
        "Pending"
      ],
      default: "Completed"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null
    },

    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null
    },

    deal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({
  createdBy: 1,
  activityDate: -1
});

activitySchema.index({
  lead: 1,
  activityDate: -1
});

activitySchema.index({
  contact: 1,
  activityDate: -1
});

activitySchema.index({
  company: 1,
  activityDate: -1
});

activitySchema.index({
  deal: 1,
  activityDate: -1
});

activitySchema.index({
  type: 1,
  activityDate: -1
});

module.exports = mongoose.model(
  "Activity",
  activitySchema
);