const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    industry: {
      type: String,
      trim: true
    },

    website: {
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

    address: {
      type: String,
      trim: true
    },

    city: {
      type: String,
      trim: true
    },

    country: {
      type: String,
      trim: true
    },

    employees: {
      type: Number
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Company", companySchema);