const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      unique: true
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    convertedFromDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      required: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    customerSince: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Churned"],
      default: "Active"
    },

    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Other indexes
customerSchema.index({ owner: 1 });
customerSchema.index({ company: 1 });
customerSchema.index({ status: 1 });

module.exports = mongoose.model(
  "Customer",
  customerSchema
);