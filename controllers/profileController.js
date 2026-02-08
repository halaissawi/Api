const { Profile, SocialLink, ProfileView, User, Product } = require("../models");
const QRCode = require("qrcode");
const { deleteImage, cloudinary } = require("../middleware/uploadMiddleware");

// ✅ UPDATED: Generate random slug (new default method)
const generateUniqueSlug = async () => {
  return await Profile.generateUniqueRandomSlug(6);
};

const generateAndUploadQR = async (profileUrl, userId) => {
  try {
    const qrBuffer = await QRCode.toBuffer(profileUrl, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 500,
      margin: 2,
    });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "linkme/qrcodes",
          public_id: `qr_${userId}_${Date.now()}`,
          format: "png",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        },
      );

      uploadStream.end(qrBuffer);
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
};

exports.createProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      profileType,
      name,
      title,
      bio,
      color,
      designMode,
      aiPrompt,
      aiBackground,
      template,
      socialLinks,
      customDesignUrl,
      // 🆕 AI Profile fields
      customProfileDesign,
      skills,
      experience,
      education,
      productId,
    } = req.body;

    // 🆕 Parse AI profile JSON fields if they're strings
    let parsedCustomProfileDesign = customProfileDesign;
    let parsedSkills = skills;
    let parsedExperience = experience;
    let parsedEducation = education;

    if (customProfileDesign && typeof customProfileDesign === "string") {
      try {
        parsedCustomProfileDesign = JSON.parse(customProfileDesign);
      } catch (e) {
        console.error("Failed to parse customProfileDesign:", e);
      }
    }

    if (skills && typeof skills === "string") {
      try {
        parsedSkills = JSON.parse(skills);
      } catch (e) {
        console.error("Failed to parse skills:", e);
      }
    }

    if (experience && typeof experience === "string") {
      try {
        parsedExperience = JSON.parse(experience);
      } catch (e) {
        console.error("Failed to parse experience:", e);
      }
    }

    if (education && typeof education === "string") {
      try {
        parsedEducation = JSON.parse(education);
      } catch (e) {
        console.error("Failed to parse education:", e);
      }
    }

    if (!name || !profileType) {
      return res.status(400).json({
        success: false,
        message: "Name and profile type are required",
      });
    }

    const existingProfile = await Profile.findOne({
      where: {
        userId,
        profileType,
        deletedAt: null,
      },
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${profileType} profile. Please update it instead.`,
      });
    }

    const slug = await generateUniqueSlug();
    const profileUrl = `https://www.linkmejo.com/u/${slug}`;

    let avatarUrl = null;
    if (req.file) {
      avatarUrl = req.file.path;
    }

    const qrCodeUrl = await generateAndUploadQR(profileUrl, userId);

    let parsedLinks = [];
    if (socialLinks) {
      parsedLinks =
        typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks;
    }

    // Validate social links before creating the profile
    if (parsedLinks.length > 0) {
      for (const link of parsedLinks) {
        if (!link.platform) continue;

        const trimmedUrl = link.url ? link.url.trim() : "";

        if (link.platform === "whatsapp") {
          const whatsappUrlRegex =
            /^https?:\/\/(wa\.me|api\.whatsapp\.com)\/\d+$/i;
          const phoneRegex = /^\+?\d{7,15}$/;

          if (
            !whatsappUrlRegex.test(trimmedUrl) &&
            !phoneRegex.test(trimmedUrl)
          ) {
            return res.status(400).json({
              success: false,
              message: `Invalid WhatsApp link or number: ${link.url}`,
            });
          }

          if (phoneRegex.test(trimmedUrl)) {
            link.url = `https://wa.me/${trimmedUrl.replace(/\D/g, "")}`;
          }
        } else if (link.platform === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmedUrl)) {
            return res.status(400).json({
              success: false,
              message: `Invalid email address: ${link.url}`,
            });
          }
        } else if (link.platform !== "phone") {
          const urlRegex = /^https?:\/\//i;
          if (!trimmedUrl || !urlRegex.test(trimmedUrl)) {
            return res.status(400).json({
              success: false,
              message: `Invalid URL for platform ${link.platform}: ${link.url}`,
            });
          }
        }
      }
    }

    // Create profile
    const profile = await Profile.create({
      userId,
      profileType,
      name,
      title: title || null,
      bio: bio || null,
      avatarUrl,
      color: color || "#0066FF",
      designMode: designMode || "manual",
      aiPrompt: aiPrompt || null,
      aiBackground: aiBackground || null,
      template: template || "template1",
      customDesignUrl: customDesignUrl || null,
      // 🆕 AI Profile fields
      customProfileDesign: parsedCustomProfileDesign || null,
      skills: parsedSkills || null,
      experience: parsedExperience || null,
      education: parsedEducation || null,
      productId: productId || null,
      slug,
      profileUrl,
      qrCodeUrl,
      isActive: true,
      viewCount: 0,
    });

    // Create social links after validation
    if (parsedLinks.length > 0) {
      const linksToCreate = parsedLinks
        .filter((link) => link.url && link.url.trim() && link.platform)
        .map((link, index) => ({
          profileId: profile.id,
          platform: link.platform,
          url: link.url.trim(),
          label: link.label || null,
          isVisible: link.isVisible !== false,
          order: index + 1,
        }));

      if (linksToCreate.length > 0) {
        await SocialLink.bulkCreate(linksToCreate);
      }
    }

    const completeProfile = await Profile.findByPk(profile.id, {
      include: [
        {
          model: SocialLink,
          as: "socialLinks",
          order: [["order", "ASC"]],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: completeProfile,
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error creating profile",
      error: error.message,
    });
  }
};

exports.getUserProfiles = async (req, res) => {
  try {
    const userId = req.user.id;

    const whereClause = { userId };

    const profiles = await Profile.findAll({
      where: whereClause,
      include: [
        {
          model: SocialLink,
          as: "socialLinks",
          order: [["order", "ASC"]],
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "category", "image", "productType"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profiles",
      error: error.message,
    });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const profile = await Profile.findOne({
      where: { id, userId },
      include: [
        {
          model: SocialLink,
          as: "socialLinks",
          order: [["order", "ASC"]],
        },
      ],
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

exports.getProfileBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const profile = await Profile.findOne({
      where: { slug, isActive: true },
      include: [
        {
          model: SocialLink,
          as: "socialLinks",
          where: { isVisible: true },
          required: false,
          order: [["order", "ASC"]],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      name,
      title,
      bio,
      color,
      designMode,
      aiPrompt,
      aiBackground,
      template,
      isActive,
      customDesignUrl,
      // 🆕 ADD THESE
      customProfileDesign,
      skills,
      experience,
      education,
    } = req.body;

    let parsedCustomProfileDesign = customProfileDesign;
    let parsedSkills = skills;
    let parsedExperience = experience;
    let parsedEducation = education;

    if (customProfileDesign && typeof customProfileDesign === "string") {
      try {
        parsedCustomProfileDesign = JSON.parse(customProfileDesign);
      } catch (e) {
        console.error("Failed to parse customProfileDesign:", e);
      }
    }

    if (skills && typeof skills === "string") {
      try {
        parsedSkills = JSON.parse(skills);
      } catch (e) {
        console.error("Failed to parse skills:", e);
      }
    }

    if (experience && typeof experience === "string") {
      try {
        parsedExperience = JSON.parse(experience);
      } catch (e) {
        console.error("Failed to parse experience:", e);
      }
    }

    if (education && typeof education === "string") {
      try {
        parsedEducation = JSON.parse(education);
      } catch (e) {
        console.error("Failed to parse education:", e);
      }
    }

    const profile = await Profile.findOne({
      where: { id, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    let avatarUrl = profile.avatarUrl;
    if (req.file) {
      if (profile.avatarUrl) {
        await deleteImage(profile.avatarUrl);
      }
      avatarUrl = req.file.path;
    }

    // ✅ CHANGED: Keep the same slug even if name changes
    // Random slugs don't need to be regenerated when name changes
    let slug = profile.slug;
    let profileUrl = profile.profileUrl;

    // No need to regenerate QR or slug when name changes
    // The slug is random and doesn't relate to the name

    await profile.update({
      name: name || profile.name,
      title: title !== undefined ? title : profile.title,
      bio: bio !== undefined ? bio : profile.bio,
      avatarUrl,
      color: color || profile.color,
      designMode: designMode || profile.designMode,
      aiPrompt: aiPrompt !== undefined ? aiPrompt : profile.aiPrompt,
      aiBackground:
        aiBackground !== undefined ? aiBackground : profile.aiBackground,
      template: template || profile.template,
      customDesignUrl:
        customDesignUrl !== undefined
          ? customDesignUrl
          : profile.customDesignUrl,
      slug, // ✅ Keep existing slug
      profileUrl, // ✅ Keep existing URL
      isActive: isActive !== undefined ? isActive : profile.isActive,
    });

    const updatedProfile = await Profile.findByPk(profile.id, {
      include: [
        {
          model: SocialLink,
          as: "socialLinks",
          order: [["order", "ASC"]],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// Add this new function to profileController.js (after updateProfile)
exports.patchProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { template, color, ...otherFields } = req.body;

    // Find profile
    const profile = await Profile.findOne({
      where: { id, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Validate pageTemplate if provided (for public profile page)
    if (req.body.pageTemplate !== undefined) {
      const validPageTemplates = [
        "luxury",
        "pastel",
        "modern",
        "cosmic",
        "minimal",
        "glass",
      ];
      if (!validPageTemplates.includes(req.body.pageTemplate)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid page template. Must be one of: luxury, pastel, modern, cosmic, minimal, glass",
        });
      }
    }

    // Validate template if provided (for card design)
    if (template !== undefined) {
      const validCardTemplates = [
        "template1",
        "template2",
        "template3",
        "template4",
        "template5",
        "template6",
      ];
      if (!validCardTemplates.includes(template)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid card template. Must be one of: template1, template2, template3, template4, template5, template6",
        });
      }
    }

    // Validate color if provided (hex format)
    if (color !== undefined && color !== null) {
      if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
        return res.status(400).json({
          success: false,
          message: "Invalid color format. Must be hex color (e.g., #FF0000)",
        });
      }
    }
    // Prepare update object
    const updateData = {};
    if (template !== undefined) updateData.template = template;
    if (req.body.pageTemplate !== undefined)
      updateData.pageTemplate = req.body.pageTemplate;
    if (color !== undefined) updateData.color = color;

    // Add any other fields from the request
    Object.keys(otherFields).forEach((key) => {
      if (otherFields[key] !== undefined) {
        updateData[key] = otherFields[key];
      }
    });

    // Update profile
    await profile.update(updateData);

    // Fetch updated profile with social links
    const updatedProfile = await Profile.findByPk(profile.id, {
      include: [
        {
          model: SocialLink,
          as: "socialLinks",
          order: [["order", "ASC"]],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};
exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Find the profile
    const profile = await Profile.findOne({
      where: { id, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // ✅ CHECK IF PROFILE HAS ORDERS BEFORE ATTEMPTING DELETE
    const { Order } = require("../models"); // Make sure Order is imported

    const orderCount = await Order.count({
      where: { profileId: id },
    });

    console.log(`Profile ${id} has ${orderCount} orders`);

    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete profile with existing orders",
        message: `This profile has ${orderCount} order(s). Physical cards have been distributed, so the profile cannot be deleted. You can still edit all information in your dashboard.`,
        hasOrders: true,
        orderCount: orderCount,
      });
    }

    // Safe to delete - no orders exist
    // Delete associated images
    if (profile.avatarUrl) {
      await deleteImage(profile.avatarUrl);
    }
    if (profile.qrCodeUrl) {
      await deleteImage(profile.qrCodeUrl);
    }
    if (profile.aiBackground) {
      await deleteImage(profile.aiBackground);
    }
    if (profile.customDesignUrl) {
      await deleteImage(profile.customDesignUrl);
    }

    // Delete the profile
    await profile.destroy();

    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting profile",
      error: error.message,
    });
  }
};

// 🆕 NEW ENDPOINT: Upload Custom Card Design
exports.uploadCustomDesign = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const profile = await Profile.findOne({
      where: { id, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No design file uploaded",
      });
    }

    // Delete old custom design if exists
    if (profile.customDesignUrl) {
      await deleteImage(profile.customDesignUrl);
    }

    // Update profile with new custom design URL
    await profile.update({
      customDesignUrl: req.file.path,
    });

    res.status(200).json({
      success: true,
      message: "Custom design uploaded successfully",
      data: {
        customDesignUrl: req.file.path,
      },
    });
  } catch (error) {
    console.error("Error uploading custom design:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading custom design",
      error: error.message,
    });
  }
};

// 🆕 NEW ENDPOINT: Remove Custom Card Design
exports.removeCustomDesign = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const profile = await Profile.findOne({
      where: { id, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (profile.customDesignUrl) {
      await deleteImage(profile.customDesignUrl);
    }

    await profile.update({
      customDesignUrl: null,
    });

    res.status(200).json({
      success: true,
      message: "Custom design removed successfully",
    });
  } catch (error) {
    console.error("Error removing custom design:", error);
    res.status(500).json({
      success: false,
      message: "Error removing custom design",
      error: error.message,
    });
  }
};
// At the end of profileController.js, update uploadTempDesign:

exports.uploadTempDesign = async (req, res) => {
  try {
    console.log("📸 [UPLOAD TEMP] Request received");
    console.log("📸 [UPLOAD TEMP] File:", req.file);

    if (!req.file) {
      console.error("❌ [UPLOAD TEMP] No file in request");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("✅ [UPLOAD TEMP] File uploaded to:", req.file.path);

    res.status(200).json({
      success: true,
      message: "Design uploaded successfully",
      url: req.file.path,
    });
  } catch (error) {
    console.error("❌ [UPLOAD TEMP] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading design",
      error: error.message,
    });
  }
};

exports.toggleProfileStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const profile = await Profile.findOne({
      where: { id, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    await profile.update({
      isActive: !profile.isActive,
    });

    res.status(200).json({
      success: true,
      message: `Profile ${
        profile.isActive ? "activated" : "deactivated"
      } successfully`,
      data: { isActive: profile.isActive },
    });
  } catch (error) {
    console.error("Error toggling profile status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling profile status",
      error: error.message,
    });
  }
};

exports.getProfileAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { days = 30 } = req.query;

    const profile = await Profile.findOne({
      where: { id, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await ProfileView.getProfileAnalytics(profile.id, {
      startDate,
    });

    const viewsOverTime = await ProfileView.getViewsOverTime(
      profile.id,
      parseInt(days),
    );

    const socialLinks = await SocialLink.findAll({
      where: { profileId: profile.id },
      attributes: ["platform", "clickCount", "url", "label"],
      order: [["clickCount", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          name: profile.name,
          slug: profile.slug,
          viewCount: profile.viewCount,
        },
        analytics,
        viewsOverTime,
        socialLinks,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
};

exports.regenerateQRCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const profile = await Profile.findOne({
      where: { id, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (profile.qrCodeUrl) {
      await deleteImage(profile.qrCodeUrl);
    }

    const newQrCodeUrl = await generateAndUploadQR(profile.profileUrl, userId);

    await profile.update({
      qrCodeUrl: newQrCodeUrl,
    });

    res.status(200).json({
      success: true,
      message: "QR code regenerated successfully",
      data: { qrCodeUrl: newQrCodeUrl },
    });
  } catch (error) {
    console.error("Error regenerating QR code:", error);
    res.status(500).json({
      success: false,
      message: "Error regenerating QR code",
      error: error.message,
    });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    const summary = await user.getAnalyticsSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard summary",
      error: error.message,
    });
  }
};
