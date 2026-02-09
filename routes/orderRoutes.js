const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const protect = authMiddleware.protect || authMiddleware;

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
};

// ==================== USER ROUTES ====================

// ✅ CHANGED: Added /create endpoint (frontend expects this)
router.post("/create", protect, orderController.createOrder);

// ✅ Keep old endpoint for backward compatibility
router.post("/", protect, orderController.createOrder);

router.get("/my-orders", protect, orderController.getUserOrders);
router.get("/:orderId", protect, orderController.getOrderById);

// ==================== ADMIN ROUTES ====================

router.get("/admin/all", protect, adminOnly, orderController.getAllOrders);
router.get("/admin/statistics", protect, adminOnly, orderController.getOrderStatistics);
router.patch("/admin/:orderId/status", protect, adminOnly, orderController.updateOrderStatus);
router.delete("/admin/:orderId", protect, adminOnly, orderController.deleteOrder);

module.exports = router;