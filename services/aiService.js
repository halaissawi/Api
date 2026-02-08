const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate complete custom design configuration from CV
 */
exports.generateCustomDesign = async (cvText, profileData) => {
  try {
    console.log("🎨 [AI Design] Generating custom design...");

    const { name, title, industry, skills } = profileData;

    const designPrompt = `
You are an expert UI/UX designer. Based on this professional's CV, create a completely unique, custom profile page design.

Professional Info:
- Name: ${name}
- Title: ${title}
- Industry: ${industry || "General"}
- Skills: ${skills?.join(", ") || "Various"}

Create a design that:
1. Matches their personality and industry
2. Is creative and unique (no generic templates)
3. Uses modern design principles
4. Is professional yet distinctive

Return a JSON design specification with:

{
  "designConcept": {
    "name": "Design concept name (e.g., 'Tech Innovator', 'Creative Minimalist')",
    "description": "Brief description of the design approach",
    "mood": "professional|creative|bold|elegant|modern|playful"
  },
  "colorPalette": {
    "primary": "#hexcode (main brand color based on industry)",
    "secondary": "#hexcode (complementary color)",
    "accent": "#hexcode (highlight color)",
    "background": "#hexcode (page background)",
    "text": "#hexcode (main text color)",
    "textSecondary": "#hexcode (secondary text)"
  },
  "layout": {
    "type": "single-column|two-column|split-screen|grid|asymmetric",
    "heroStyle": "full-width|centered|split|minimal|bold",
    "sectionArrangement": ["hero", "about", "experience", "skills", "contact"],
    "spacing": "compact|comfortable|spacious"
  },
  "typography": {
    "headingFont": "Inter|Poppins|Montserrat|Playfair Display|Space Grotesk",
    "bodyFont": "Inter|Roboto|Open Sans|Lato",
    "headingSize": "large|xlarge|2xl",
    "style": "modern|classic|bold|minimal"
  },
  "sections": {
    "hero": {
      "layout": "centered|left-aligned|split|minimal|bold",
      "showImage": true|false,
      "imageStyle": "circle|square|rounded|blob",
      "backgroundStyle": "solid|gradient|pattern|image"
    },
    "about": {
      "layout": "card|inline|sidebar|floating",
      "style": "minimal|detailed|creative"
    },
    "experience": {
      "layout": "timeline|cards|list|grid",
      "style": "minimal|detailed|visual",
      "iconStyle": "line|solid|gradient"
    },
    "skills": {
      "layout": "tags|bars|grid|cloud|categories",
      "style": "minimal|colorful|badges"
    },
    "contact": {
      "layout": "buttons|cards|minimal|grid",
      "style": "bold|subtle|creative"
    }
  },
  "effects": {
    "animations": ["fade-in|slide-up|scale|none"],
    "hover": "scale|glow|lift|color-shift|none",
    "transitions": "smooth|bouncy|instant"
  },
  "uniqueFeatures": [
    "Special design elements that make this profile stand out (e.g., 'Floating skill bubbles', 'Diagonal section dividers', 'Glassmorphism cards')"
  ]
}

Guidelines:
- For tech/developer: Use blues, purples, modern geometric shapes
- For creative/designer: Use bold colors, asymmetric layouts, artistic elements
- For business/corporate: Use navy, grays, clean lines, professional spacing
- For medical/healthcare: Use calming blues/greens, trustworthy layout
- For education: Use warm colors, friendly layouts

Make it UNIQUE and CREATIVE - no generic designs!
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert UI/UX designer specializing in creating unique, custom profile designs. Always return valid JSON only.",
        },
        {
          role: "user",
          content: designPrompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const designSpec = JSON.parse(completion.choices[0].message.content);

    console.log(
      "✅ [AI Design] Custom design generated:",
      designSpec.designConcept?.name,
    );
    console.log("🎨 [AI Design] Colors:", designSpec.colorPalette);
    console.log("📐 [AI Design] Layout:", designSpec.layout?.type);

    return designSpec;
  } catch (error) {
    console.error("❌ [AI Design] Error generating design:", error);

    // Return fallback design if AI fails
    return {
      designConcept: {
        name: "Modern Professional",
        description: "Clean, modern design with focus on content",
        mood: "professional",
      },
      colorPalette: {
        primary: "#2563eb",
        secondary: "#8b5cf6",
        accent: "#f59e0b",
        background: "#ffffff",
        text: "#1f2937",
        textSecondary: "#6b7280",
      },
      layout: {
        type: "single-column",
        heroStyle: "centered",
        sectionArrangement: [
          "hero",
          "about",
          "experience",
          "skills",
          "contact",
        ],
        spacing: "comfortable",
      },
      typography: {
        headingFont: "Inter",
        bodyFont: "Inter",
        headingSize: "xlarge",
        style: "modern",
      },
      sections: {
        hero: {
          layout: "centered",
          showImage: true,
          imageStyle: "circle",
          backgroundStyle: "gradient",
        },
        about: { layout: "card", style: "minimal" },
        experience: {
          layout: "timeline",
          style: "detailed",
          iconStyle: "solid",
        },
        skills: { layout: "tags", style: "colorful" },
        contact: { layout: "buttons", style: "bold" },
      },
      effects: {
        animations: ["fade-in"],
        hover: "scale",
        transitions: "smooth",
      },
      uniqueFeatures: ["Clean modern layout", "Gradient accents"],
    };
  }
};

/**
 * Enhanced CV parsing with design consideration
 */
exports.parseCVWithCustomDesign = async (cvText) => {
  try {
    console.log("🤖 [AI] Starting enhanced CV parsing...");

    const prompt = `
Analyze this CV and extract information for creating a custom profile:

${cvText}

Return JSON with:
{
  "name": "Full name",
  "title": "Professional title/role",
  "bio": "Compelling 2-3 sentence professional summary",
  "email": "email or null",
  "phone": "phone or null",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "Years",
      "description": "Brief description"
    }
  ],
  "education": [
    {
      "institution": "School name",
      "degree": "Degree",
      "year": "Year"
    }
  ],
  "industry": "Primary industry/field",
  "personality": "professional|creative|technical|business (based on CV tone)",
  "socialMedia": {
    "linkedin": "username or null",
    "github": "username or null",
    "twitter": "username or null",
    "website": "url or null"
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert CV parser. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const profileData = JSON.parse(completion.choices[0].message.content);
    console.log("✅ [AI] Profile data extracted:", profileData.name);

    return profileData;
  } catch (error) {
    console.error("❌ [AI] Error parsing CV:", error);
    throw error;
  }
};

/**
 * Generate profile image with AI
 */
exports.generateProfileImage = async (profileData) => {
  try {
    const { name, title, industry } = profileData;
    const imagePrompt = `Professional headshot portrait, ${title}, business attire, neutral background, high quality, professional lighting`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      imagePrompt,
    )}?width=512&height=512&nologo=true&model=flux`;
    console.log("✅ [AI] Profile image generated");
    return imageUrl;
  } catch (error) {
    console.error("❌ [AI] Image generation failed:", error);
    return null;
  }
};

/**
 * Complete CV to Custom Profile pipeline
 */
exports.generateCompleteCustomProfile = async (cvText) => {
  try {
    console.log("🚀 [AI] Starting complete custom profile generation...");

    // Step 1: Parse CV data
    const profileData = await exports.parseCVWithCustomDesign(cvText);

    // Step 2: Generate custom design
    const customDesign = await exports.generateCustomDesign(
      cvText,
      profileData,
    );

    // Step 3: Generate profile image
    const profileImage = await exports.generateProfileImage(profileData);

    const completeProfile = {
      // Profile Data
      name: profileData.name,
      title: profileData.title,
      bio: profileData.bio,
      email: profileData.email,
      phone: profileData.phone,
      skills: profileData.skills,
      experience: profileData.experience,
      education: profileData.education,
      industry: profileData.industry,
      personality: profileData.personality,
      suggestedSocialLinks: profileData.socialMedia,

      // Custom Design
      customDesign: customDesign,

      // Generated Assets
      aiGeneratedImage: profileImage,

      // Metadata
      profileType: "personal",
      isAICustomProfile: true, // ✅ FLAG for frontend detection
      generatedAt: new Date().toISOString(),
    };

    console.log("✅ [AI] Complete custom profile generated!");
    console.log("🎨 Design:", customDesign.designConcept?.name);

    return completeProfile;
  } catch (error) {
    console.error("❌ [AI] Error generating complete profile:", error);
    throw error;
  }
};
