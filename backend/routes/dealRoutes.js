const express = require("express");

const {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  getAssignableUsers
} = require("../controllers/dealController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// =====================================
// GET ASSIGNABLE USERS
// Admin + Manager
// =====================================

router.get(
  "/assignable-users",
  protect,
  authorize("admin", "manager"),
  getAssignableUsers
);


// =====================================
// CREATE DEAL
// Admin + Manager + Sales
// =====================================

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "sales"
  ),
  createDeal
);


// =====================================
// GET ALL DEALS
// Admin + Manager + Sales
// =====================================

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "sales"
  ),
  getDeals
);


// =====================================
// GET SINGLE DEAL
// Admin + Manager + Sales
// =====================================

router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "sales"
  ),
  getDealById
);


// =====================================
// UPDATE DEAL
// Admin + Manager + Sales
// =====================================

router.put(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "sales"
  ),
  updateDeal
);


// =====================================
// DELETE DEAL
// Admin only
// =====================================

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteDeal
);


module.exports = router;