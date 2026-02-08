const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

// Configure multer for CV upload (memory storage for PDF parsing)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF files are allowed for CV upload.",
        ),
      );
    }
  },
});

// Multer error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 5MB limit",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

// ============================================
// AI ROUTES
// ============================================

/**
 * POST /api/ai/parse-cv
 * Upload CV and generate profile data
 * Requires authentication
 */
router.post(
  "/parse-cv",
  authMiddleware,
  upload.single("cv"),
  handleUploadError,
  aiController.parseCV,
);

/**
 * POST /api/ai/regenerate-image
 * Regenerate profile image with AI
 * Requires authentication
 */
router.post("/regenerate-image", authMiddleware, aiController.regenerateImage);

/**
 * POST /api/ai/design-suggestions
 * Get AI-powered design suggestions
 * Requires authentication
 */
router.post(
  "/design-suggestions",
  authMiddleware,
  aiController.getDesignSuggestions,
);

/**
 * GET /api/ai/test
 * Test AI service connection
 * Requires authentication (for security)
 */
router.get("/test", authMiddleware, aiController.testAI);

module.exports = router;
