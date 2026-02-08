const cvParser = require("../services/cvParser");
const aiService = require("../services/aiService");

/**
 * Upload CV and generate CUSTOM DESIGNED profile
 * POST /api/ai/parse-cv
 */
exports.parseCV = async (req, res) => {
  try {
    console.log("📤 [AI Controller] CV upload request received");

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No CV file uploaded. Please upload a PDF file.",
      });
    }

    console.log("📄 [AI Controller] File received:", {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // Step 1: Validate CV file
    cvParser.validateCVFile(req.file);

    // Step 2: Extract text from PDF
    let cvText;
    try {
      cvText = await cvParser.extractTextFromPDF(req.file.buffer);
    } catch (error) {
      console.error("❌ [AI Controller] PDF extraction failed:", error);
      return res.status(400).json({
        success: false,
        message: "Unable to read your CV. This usually happens when:",
        reasons: [
          "The PDF is scanned (image-based) rather than text-based",
          "The PDF is password-protected or corrupted",
          "The file has very complex formatting",
        ],
        solution:
          "Please try exporting your CV as a new PDF from Word, Google Docs, or your resume builder.",
        technicalError: error.message,
      });
    }

    // Step 3: Clean CV text
    const cleanedText = cvParser.cleanCVText(cvText);

    // Step 4: Extract basic info (for validation)
    const basicInfo = cvParser.extractBasicInfo(cleanedText);
    console.log("📊 [AI Controller] Basic CV info:", basicInfo);

    // Step 5: Generate COMPLETE CUSTOM PROFILE with AI
    let completeProfile;
    try {
      console.log("🎨 [AI Controller] Generating custom designed profile...");
      completeProfile =
        await aiService.generateCompleteCustomProfile(cleanedText);
    } catch (error) {
      console.error("❌ [AI Controller] AI generation failed:", error);
      return res.status(500).json({
        success: false,
        message:
          "AI processing failed. Please try again or contact support if the issue persists.",
        error: error.message,
      });
    }

    // Step 6: Return complete custom profile
    console.log("✅ [AI Controller] Custom profile generated successfully!");
    console.log(
      "🎨 Design Concept:",
      completeProfile.customDesign?.designConcept?.name,
    );

    res.status(200).json({
      success: true,
      message:
        "CV parsed successfully! Your custom profile has been generated.",
      data: {
        profile: completeProfile,
        metadata: {
          cvWordCount: basicInfo.wordCount,
          sectionsFound: basicInfo.estimatedSections,
          hasContactInfo: basicInfo.hasEmail || basicInfo.hasPhone,
          processedAt: new Date().toISOString(),
          designConcept: completeProfile.customDesign?.designConcept,
        },
      },
    });
  } catch (error) {
    console.error("❌ [AI Controller] Error processing CV:", error);

    // Handle different error types
    if (error.message.includes("API key")) {
      return res.status(500).json({
        success: false,
        message: "AI service configuration error. Please contact support.",
        error: "OpenAI API key not configured",
      });
    }

    res.status(500).json({
      success: false,
      message: "An error occurred while processing your CV. Please try again.",
      error: error.message,
    });
  }
};

/**
 * Regenerate profile image
 * POST /api/ai/regenerate-image
 */
exports.regenerateImage = async (req, res) => {
  try {
    const { name, title, industry, designStyle } = req.body;

    if (!name || !title) {
      return res.status(400).json({
        success: false,
        message: "Name and title are required",
      });
    }

    console.log("🎨 [AI Controller] Regenerating profile image...");

    const profileData = {
      name,
      title,
      industry: industry || "Professional",
      designConfig: {
        style: designStyle || "professional",
      },
    };

    const imageUrl = await aiService.generateProfileImage(profileData);

    res.status(200).json({
      success: true,
      message: "Profile image regenerated successfully",
      data: {
        imageUrl,
      },
    });
  } catch (error) {
    console.error("❌ [AI Controller] Error regenerating image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate image",
      error: error.message,
    });
  }
};

/**
 * Regenerate custom design
 * POST /api/ai/regenerate-design
 */
exports.regenerateDesign = async (req, res) => {
  try {
    const { profileData, cvText } = req.body;

    if (!profileData || !cvText) {
      return res.status(400).json({
        success: false,
        message: "Profile data and CV text are required",
      });
    }

    console.log("🎨 [AI Controller] Regenerating custom design...");

    const customDesign = await aiService.generateCustomDesign(
      cvText,
      profileData,
    );

    res.status(200).json({
      success: true,
      message: "Custom design regenerated successfully",
      data: {
        customDesign,
      },
    });
  } catch (error) {
    console.error("❌ [AI Controller] Error regenerating design:", error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate design",
      error: error.message,
    });
  }
};

/**
 * Get design recommendations (simplified for custom designs)
 * POST /api/ai/design-suggestions
 */
exports.getDesignSuggestions = async (req, res) => {
  try {
    const { industry, title, profileType } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    console.log("🎨 [AI Controller] Generating design suggestions...");

    // Return some quick design mood suggestions
    const suggestions = [
      {
        name: "Bold & Creative",
        mood: "creative",
        description: "Vibrant colors, asymmetric layouts, eye-catching design",
        colors: ["#FF6B6B", "#4ECDC4", "#FFE66D"],
      },
      {
        name: "Professional & Clean",
        mood: "professional",
        description: "Clean lines, corporate colors, trustworthy design",
        colors: ["#2563EB", "#1F2937", "#F3F4F6"],
      },
      {
        name: "Modern & Minimal",
        mood: "modern",
        description: "Lots of whitespace, minimal elements, elegant typography",
        colors: ["#000000", "#FFFFFF", "#6B7280"],
      },
    ];

    res.status(200).json({
      success: true,
      message: "Design suggestions generated",
      data: {
        suggestions,
      },
    });
  } catch (error) {
    console.error("❌ [AI Controller] Error getting suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate design suggestions",
      error: error.message,
    });
  }
};

/**
 * Test AI service connection
 * GET /api/ai/test
 */
exports.testAI = async (req, res) => {
  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Say 'AI service is working!' in JSON format",
        },
      ],
      max_tokens: 50,
    });

    res.status(200).json({
      success: true,
      message: "AI service is working!",
      data: {
        response: completion.choices[0].message.content,
        model: completion.model,
      },
    });
  } catch (error) {
    console.error("❌ [AI Controller] AI test failed:", error);
    res.status(500).json({
      success: false,
      message: "AI service test failed",
      error: error.message,
    });
  }
};
