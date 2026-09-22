const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    value: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    stage: {
      type: String,
      enum: [
        "New",
        "Qualified",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost"
      ],
      default: "New"
    },

    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 20
    },

    expectedCloseDate: {
      type: Date
    },

    // ===============================
    // LOST DEAL REASON
    // ===============================
    lostReason: {
      type: String,
      enum: [
        "Price",
        "Competitor",
        "No Budget",
        "Not Interested",
        "Timing",
        "No Response",
        "Other"
      ],
      default: null
    },

    // ===============================
    // WON / LOST DATES
    // ===============================
    wonAt: {
      type: Date,
      default: null
    },

    lostAt: {
      type: Date,
      default: null
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead"
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Deal", dealSchema);