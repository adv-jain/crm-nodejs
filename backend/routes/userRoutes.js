const express = require("express");

const {
  createUser,
  signupUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// PUBLIC ROUTES
// ======================================================

// Login
router.post("/login", loginUser);

// Public signup
router.post("/signup", signupUser);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password/:token", resetPassword);


// ======================================================
// ADMIN ONLY ROUTES
// ======================================================

// Create user
router.post(
  "/",
  protect,
  authorize("admin"),
  createUser
);

// Get all users
router.get(
  "/",
  protect,
  authorize("admin"),
  getUsers
);

// Get single user
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getUserById
);

// Update user
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateUser
);

// Activate / deactivate user
router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  updateUserStatus
);

// Delete user
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteUser
);


module.exports = router;