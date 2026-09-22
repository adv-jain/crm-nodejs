const express = require("express");

const {
  getDashboardSummary,
  getDashboardPipeline,
  getDashboardLeadSources,
  getDashboardRecent
} = require("../controllers/dashboardController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// =====================================================
// DASHBOARD SUMMARY
// =====================================================

router.get(
  "/summary",
  protect,
  authorize("admin", "manager", "sales"),
  getDashboardSummary
);


// =====================================================
// SALES PIPELINE
// =====================================================

router.get(
  "/pipeline",
  protect,
  authorize("admin", "manager", "sales"),
  getDashboardPipeline
);


// =====================================================
// LEAD SOURCES
// =====================================================

router.get(
  "/lead-sources",
  protect,
  authorize("admin", "manager", "sales"),
  getDashboardLeadSources
);


// =====================================================
// RECENT ACTIVITIES + UPCOMING TASKS
// =====================================================

router.get(
  "/recent",
  protect,
  authorize("admin", "manager", "sales"),
  getDashboardRecent
);


module.exports = router;