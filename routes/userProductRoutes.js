const express = require("express");
const router = express.Router();
const {
  purchaseProduct,
  getUserProducts,
  getUserProduct,
  setupUserProduct,
  deleteUserProduct,
  toggleUserProductStatus,
  getPublicUserProduct,
} = require("../controllers/userProductController");

const authMiddleware = require("../middleware/authMiddleware");

// Public routes (No Auth required)
router.get("/:id/public", getPublicUserProduct);

// All routes below require authentication
router.use(authMiddleware);

// Purchase a product
router.post("/purchase", purchaseProduct);

// Get all user products
router.get("/", getUserProducts);

// Get single user product
router.get("/:id", getUserProduct);

// Setup/update user product
router.put("/:id/setup", setupUserProduct);

// Delete user product
router.delete("/:id", deleteUserProduct);

// Toggle product status
router.patch("/:id/toggle-status", toggleUserProductStatus);

module.exports = router;
