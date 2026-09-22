
const express = require("express");

const {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getAssignableUsers
} = require("../controllers/contactController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// Create Contact
// ==========================================

router.post(
  "/",
  protect,
  authorize("admin", "manager", "sales"),
  createContact
);


// ==========================================
// Get All Contacts
// ==========================================

router.get(
  "/",
  protect,
  authorize("admin", "manager", "sales"),
  getContacts
);


// ==========================================
// Get Assignable Users
// IMPORTANT: This must come before /:id
// ==========================================

router.get(
  "/assignable-users",
  protect,
  authorize("admin", "manager"),
  getAssignableUsers
);


// ==========================================
// Get Single Contact
// ==========================================

router.get(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  getContactById
);


// ==========================================
// Update Contact
// ==========================================

router.put(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  updateContact
);


// ==========================================
// Delete Contact - Admin Only
// ==========================================

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteContact
);


module.exports = router;

