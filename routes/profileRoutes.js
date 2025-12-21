const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  uploadProfile,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

const profileController = require("../controllers/profileController");
const profileViewController = require("../controllers/profileViewController");

// ============================================
// 🔥 IMPORTANT: SPECIFIC ROUTES FIRST
// ============================================

// Dashboard summary (must be before /:id)
router.get(
  "/dashboard/summary",
  authMiddleware,
  profileController.getDashboardSummary
);

// All visitors (must be before /:id)
router.get(
  "/all-visitors",
  authMiddleware,
  profileViewController.getAllVisitorContacts
);

// 🆕 Upload temp design (must be before /:id)
router.post(
  "/upload-temp",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.uploadTempDesign
);

// Public profile by slug (must be before /:id)
router.get("/public/:slug", profileController.getProfileBySlug);

// Public visitor contact (must be before /:id)
router.post(
  "/public/:slug/visitor-contact",
  profileViewController.saveVisitorContact
);

// ============================================
// STANDARD CRUD ROUTES
// ============================================

// Create profile
router.post(
  "/",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.createProfile
);

// Get all user profiles
router.get("/", authMiddleware, profileController.getUserProfiles);

// Get profile by ID
router.get("/:id", authMiddleware, profileController.getProfileById);

// Update profile
router.put(
  "/:id",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.updateProfile
);

// Delete profile
router.delete("/:id", authMiddleware, profileController.deleteProfile);

// ============================================
// PROFILE-SPECIFIC ROUTES (with :id)
// ============================================

// Custom design management
router.post(
  "/:id/custom-design",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.uploadCustomDesign
);

router.delete(
  "/:id/custom-design",
  authMiddleware,
  profileController.removeCustomDesign
);

// Toggle profile status
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  profileController.toggleProfileStatus
);

// Analytics
router.get(
  "/:id/analytics",
  authMiddleware,
  profileController.getProfileAnalytics
);

// Regenerate QR
router.post(
  "/:id/regenerate-qr",
  authMiddleware,
  profileController.regenerateQRCode
);

// Visitors
router.get(
  "/:id/visitors",
  authMiddleware,
  profileViewController.getProfileVisitors
);

router.get(
  "/:id/visitors/stats",
  authMiddleware,
  profileViewController.getVisitorStats
);

module.exports = router;
