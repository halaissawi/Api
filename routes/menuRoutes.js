const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController.js");
const authMiddleware = require("../middleware/authMiddleware");

// Protected routes
router.post("/create", authMiddleware, menuController.createMenu);
router.get("/my-menus", authMiddleware, menuController.getMyMenus);
router.get("/id/:id", authMiddleware, menuController.getMenuById);
router.put("/:id", authMiddleware, menuController.updateMenu);
router.patch("/:id/toggle-status", authMiddleware, menuController.toggleMenuStatus);
router.delete("/:id", authMiddleware, menuController.deleteMenu);

// Public routes
router.get("/:slug", menuController.getMenuBySlug);

module.exports = router;
