const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  uploadMenuLogo,
  uploadMenuCover,
  uploadMenuItem,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

// Helper to handle successful upload response
const sendUploadSuccess = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: {
      url: req.file.path,
      filename: req.file.filename,
    },
  });
};

router.post(
  "/logo",
  authMiddleware,
  uploadMenuLogo,
  handleUploadError,
  sendUploadSuccess
);

router.post(
  "/coverImage",
  authMiddleware,
  uploadMenuCover,
  handleUploadError,
  sendUploadSuccess
);

router.post(
  "/menu-item",
  authMiddleware,
  uploadMenuItem,
  handleUploadError,
  sendUploadSuccess
);

module.exports = router;
