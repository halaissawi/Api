// Backend: routes/ai.js

const express = require("express");
const router = express.Router();

// No need for node-fetch - fetch is built-in in Node 18+!

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

router.post("/generate-ai-image", async (req, res) => {
  try {
    const {
      prompt,
      width = 1024,
      height = 640,
      type = "background",
    } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    // Enhanced prompt based on type
    let enhancedPrompt;
    if (type === "logo") {
      enhancedPrompt = `professional minimalist logo icon for ${prompt}, simple clean design, centered on white background, vector style, no text, no words, no letters`;
    } else {
      enhancedPrompt = `abstract ${prompt} background, elegant smooth gradient texture, professional wallpaper quality, pure visual design, absolutely no text anywhere, no words, no letters, no symbols, only colors and patterns`;
    }

    const seed = Date.now();
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt
    )}`;

    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      model: "flux",
      nologo: "true",
      enhance: "true",
      seed: seed.toString(),
    });

    const fullUrl = `${imageUrl}?${params.toString()}`;

    console.log("🎨 Generating image with Pollinations API...");
    console.log("📝 Enhanced Prompt:", enhancedPrompt);
    console.log("🔗 Full URL:", fullUrl);

    // Native fetch (available in Node 18+)
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${POLLINATIONS_API_KEY}`,
        Accept: "image/*",
      },
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response headers:", Object.fromEntries(response.headers));

    if (!response.ok) {
      console.error(
        "❌ Pollinations API error:",
        response.status,
        response.statusText
      );
      throw new Error(`Pollinations API error: ${response.status}`);
    }

    console.log("✅ Image received from Pollinations");

    // Convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("📦 Buffer size:", buffer.length, "bytes");

    // Convert to base64
    const contentType = response.headers.get("content-type") || "image/png";
    const base64Image = `data:${contentType};base64,${buffer.toString(
      "base64"
    )}`;

    console.log("✅ Image converted to base64");
    console.log("📏 Base64 length:", base64Image.length);

    res.json({
      success: true,
      imageUrl: base64Image,
    });
  } catch (error) {
    console.error("❌ AI generation error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate image",
    });
  }
});

module.exports = router;
