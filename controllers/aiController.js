const { HfInference } = require("@huggingface/inference");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const generateBackground = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Check if API key exists
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.error(
        "❌ HUGGINGFACE_API_KEY not found in environment variables"
      );
      return res.status(500).json({
        error: "API key not configured",
        details: "Please set HUGGINGFACE_API_KEY in your .env file",
      });
    }

    console.log("🎨 Generating abstract background with Hugging Face");
    console.log("📝 User prompt:", prompt);

    // Enhanced prompt for abstract backgrounds
    const enhancedPrompt = `Abstract gradient background: ${prompt}. Modern minimalist design, smooth color transitions, elegant professional aesthetic, premium quality, no objects, no characters, no text, no logos, pure abstract art`;

    console.log("🚀 Sending request to Hugging Face...");

    // Use Stable Diffusion XL - Most reliable model
    const blob = await hf.textToImage({
      model: "stabilityai/stable-diffusion-xl-base-1.0",
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt:
          "cartoon, character, person, face, object, text, words, watermark, logo, low quality, blurry",
        width: 1024,
        height: 768,
      },
    });

    console.log("✅ Image generated successfully!");

    // Convert blob to buffer
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Convert to base64 for Cloudinary upload
    const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;

    console.log("☁️ Uploading to Cloudinary...");

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "linkme-ai-backgrounds",
      resource_type: "auto",
    });

    console.log("✅ Image uploaded to Cloudinary:", uploadResult.secure_url);

    res.json({ imageUrl: uploadResult.secure_url });
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
    });

    res.status(500).json({
      error: "Failed to generate background",
      details: error.message || "Unknown error occurred",
    });
  }
};

const generateLogo = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Check if API key exists
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.error(
        "❌ HUGGINGFACE_API_KEY not found in environment variables"
      );
      return res.status(500).json({
        error: "API key not configured",
        details: "Please set HUGGINGFACE_API_KEY in your .env file",
      });
    }

    console.log("🎨 Generating logo with Hugging Face");
    console.log("📝 User prompt:", prompt);

    // Enhanced prompt for logos
    const enhancedPrompt = `Professional minimalist logo design: ${prompt}, vector art style, flat design, simple geometric shapes, clean lines, modern corporate identity, centered composition, solid background, high contrast, professional branding, no text, no watermarks`;

    console.log("🚀 Sending request to Hugging Face...");

    // Use Stable Diffusion XL
    const blob = await hf.textToImage({
      model: "stabilityai/stable-diffusion-xl-base-1.0",
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt:
          "text, words, letters, watermark, low quality, blurry, cartoon",
        width: 1024,
        height: 1024,
      },
    });

    console.log("✅ Logo generated successfully!");

    // Convert blob to buffer
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Convert to base64 for Cloudinary upload
    const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;

    console.log("☁️ Uploading to Cloudinary...");

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "linkme-ai-logos",
      resource_type: "auto",
    });

    console.log("✅ Logo uploaded to Cloudinary:", uploadResult.secure_url);

    res.json({ imageUrl: uploadResult.secure_url });
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
    });

    res.status(500).json({
      error: "Failed to generate logo",
      details: error.message || "Unknown error occurred",
    });
  }
};

module.exports = {
  generateBackground,
  generateLogo,
};
