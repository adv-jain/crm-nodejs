const express = require("express");

const {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivityUsers
} = require("../controllers/activityController");

const protect = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// Users must come before /:id
router.get(
  "/users",
  protect,
  authorize(
    "admin",
    "manager"
  ),
  getActivityUsers
);


// Create
router.post(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "sales"
  ),
  createActivity
);


// Get all
router.get(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "sales"
  ),
  getActivities
);


// Get single
router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "sales"
  ),
  getActivityById
);


// Update
router.put(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "sales"
  ),
  updateActivity
);


// Delete
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteActivity
);


module.exports = router;