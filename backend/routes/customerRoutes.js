const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getAssignableUsers
} = require("../controllers/customerController");

// IMPORTANT:
// assignable-users route must come before /:id
router.get(
  "/assignable-users",
  protect,
  authorize("admin", "manager"),
  getAssignableUsers
);

router.post(
  "/",
  protect,
  authorize("admin", "manager", "sales"),
  createCustomer
);

router.get(
  "/",
  protect,
  authorize("admin", "manager", "sales"),
  getCustomers
);

router.get(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  getCustomerById
);

router.put(
  "/:id",
  protect,
  authorize("admin", "manager", "sales"),
  updateCustomer
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteCustomer
);

module.exports = router;