const express = require("express");

const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
} = require("../controllers/companyController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// Create Company
router.post(
  "/",
  protect,
  authorize("admin", "manager", "sales"),
  createCompany
);


// Get All Companies
router.get(
  "/",
  protect,
  authorize("admin", "manager", "sales"),
  getCompanies
);


// Get Single Company
router.get(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  getCompanyById
);


// Update Company
router.put(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  updateCompany
);


// Delete Company
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteCompany
);


module.exports = router;