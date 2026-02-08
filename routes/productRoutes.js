const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getAllProductsAdmin,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateProductOrder,
} = require("../controllers/productController");

// ✅ Use your EXISTING middleware
const authMiddleware = require("../middleware/authMiddleware");

// Create a simple authorize wrapper
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Admin only.`,
      });
    }
    next();
  };
};

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProduct);

// Admin routes - use authMiddleware then authorize
router.get(
  "/admin/all",
  authMiddleware,
  authorize("admin"),
  getAllProductsAdmin,
);
router.post("/", authMiddleware, authorize("admin"), createProduct);
router.put("/:id", authMiddleware, authorize("admin"), updateProduct);
router.delete("/:id", authMiddleware, authorize("admin"), deleteProduct);
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  authorize("admin"),
  toggleProductStatus,
);
router.patch(
  "/order/update",
  authMiddleware,
  authorize("admin"),
  updateProductOrder,
);

module.exports = router;
