const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC INFORMATION
    // =====================================================

    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      trim: true
    },

    // =====================================================
    // LEAD INFORMATION
    // =====================================================

    source: {
      type: String,
      enum: [
        "Website",
        "Facebook",
        "Instagram",
        "Google Ads",
        "LinkedIn",
        "Referral",
        "Cold Call",
        "Email Campaign",
        "Other"
      ],
      default: "Other"
    },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Qualified",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost"
      ],
      default: "New"
    },

    value: {
      type: Number,
      default: 0
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    // =====================================================
    // RELATIONSHIPS
    // =====================================================

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // =====================================================
    // NOTES
    // =====================================================

    notes: {
      type: String,
      trim: true
    },

    // =====================================================
    // LEAD CONVERSION
    // =====================================================

    isConverted: {
      type: Boolean,
      default: false
    },

    convertedAt: {
      type: Date
    },

    convertedContact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Lead", leadSchema);