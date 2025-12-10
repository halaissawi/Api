const express = require("express");
const router = express.Router();
const {
  generateBackground,
  generateLogo,
} = require("../controllers/aiController");

// POST /api/ai/generate-background
router.post("/generate-background", generateBackground);

// POST /api/ai/generate-logo
router.post("/generate-logo", generateLogo);

module.exports = router;
