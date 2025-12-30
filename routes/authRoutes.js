const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

// ✅ Import required dependencies
const authMiddleware = require("../middleware/authMiddleware");
const { User, Profile, SocialLink, Order } = require("../models");
const { sequelize } = require("../models");
const { Op } = require("sequelize");

// Auth routes
router.post("/signup", authController.signUp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/login", authController.login);
router.post("/admin/login", authController.adminLogin);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// OAuth routes
router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleAuthCallback);

router.get("/facebook", authController.facebookAuth);
router.get("/facebook/callback", authController.facebookAuthCallback);

// ✅ Delete account - FIXED: use authMiddleware and proper imports
router.delete("/delete-account", authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { confirmation } = req.body;

    if (confirmation?.toLowerCase() !== "delete") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid confirmation. Please type DELETE to confirm.",
      });
    }

    const userId = req.user.id;

    // Find user
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      `🗑️ Soft deleting account for user: ${user.email} (ID: ${userId})`
    );

    // Get all profiles for this user
    const profiles = await Profile.findAll({
      where: { userId },
      transaction,
    });

    console.log(`📋 Found ${profiles.length} profiles to soft delete`);

    // Soft delete all profiles (if paranoid is enabled)
    for (const profile of profiles) {
      await profile.destroy({ transaction }); // This sets deletedAt
    }

    // Deactivate orders (keep for records)
    await Order.update(
      { status: "cancelled" },
      {
        where: { userId },
        transaction,
      }
    );

    // Soft delete the user
    await user.destroy({ transaction }); // This sets deletedAt

    console.log(`✅ Account soft deleted successfully: ${user.email}`);

    await transaction.commit();

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
});

module.exports = router;
