const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
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
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      trim: true
    },

    designation: {
      type: String,
      trim: true
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead"
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
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

module.exports = mongoose.model("Contact", contactSchema);