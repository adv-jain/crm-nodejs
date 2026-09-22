const express = require("express");

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAssignableUsers
} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ========================================
// ASSIGNABLE USERS
// Admin + Manager
// ========================================

router.get(
  "/assignable-users",
  protect,
  authorize("admin", "manager"),
  getAssignableUsers
);


// ========================================
// CREATE TASK
// Admin + Manager + Sales
// ========================================

router.post(
  "/",
  protect,
  authorize("admin", "manager", "sales"),
  createTask
);


// ========================================
// GET ALL TASKS
// Admin + Manager + Sales
// ========================================

router.get(
  "/",
  protect,
  authorize("admin", "manager", "sales"),
  getTasks
);


// ========================================
// GET SINGLE TASK
// Admin + Manager + Sales
// ========================================

router.get(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  getTaskById
);


// ========================================
// UPDATE TASK
// Admin + Manager + Sales
// ========================================

router.put(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  updateTask
);


// ========================================
// DELETE TASK
// ADMIN ONLY
// ========================================

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteTask
);


module.exports = router;