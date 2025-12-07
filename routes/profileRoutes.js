const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  uploadProfile,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

const profileController = require("../controllers/profileController");
const profileViewController = require("../controllers/profileViewController");

router.post(
  "/",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.createProfile
);

router.get("/", authMiddleware, profileController.getUserProfiles);

// ✅ MOVE THIS BEFORE /:id ROUTE
router.get(
  "/all-visitors",
  authMiddleware,
  profileViewController.getAllVisitorContacts
);
// 🆕 ADD THIS ROUTE (must be BEFORE /:id routes)
router.post(
  "/upload-temp",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.uploadTempDesign
);

router.get("/:id", authMiddleware, profileController.getProfileById);

router.put(
  "/:id",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.updateProfile
);

router.delete("/:id", authMiddleware, profileController.deleteProfile);

// 🆕 NEW ROUTES: Custom Card Design Management
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

router.patch(
  "/:id/toggle-status",
  authMiddleware,
  profileController.toggleProfileStatus
);

router.get(
  "/:id/analytics",
  authMiddleware,
  profileController.getProfileAnalytics
);

router.post(
  "/:id/regenerate-qr",
  authMiddleware,
  profileController.regenerateQRCode
);

router.get(
  "/dashboard/summary",
  authMiddleware,
  profileController.getDashboardSummary
);

router.get("/public/:slug", profileController.getProfileBySlug);

router.post(
  "/public/:slug/visitor-contact",
  profileViewController.saveVisitorContact
);

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
