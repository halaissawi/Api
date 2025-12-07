const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai/generate-image
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // تحسين الـ prompt زي ما كنتِ تعمليه
    const enhancedPrompt = `Abstract professional business card background, ${prompt}, modern gradient, elegant, clean, minimalist, premium quality, ultra detailed, cinematic lighting`;

    // نختار موديل الصورة
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["IMAGE"],
      },
    });

    const result = await model.generateContent(enhancedPrompt);

    // نستخرج الصورة من الرد
    const imagePart = result.response.candidates[0].content.parts.find(
      (p) => p.inlineData
    );

    if (!imagePart) {
      return res.status(500).json({ error: "No image returned from Gemini" });
    }

    const base64 = imagePart.inlineData.data;
    const mime = imagePart.inlineData.mimeType || "image/png";

    // نرجّع الصورة كـ Data URL للفرونت
    const imageUrl = `data:${mime};base64,${base64}`;

    return res.json({ imageUrl });
  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "Failed to generate image" });
  }
});

module.exports = router;
