const { Profile, SocialLink, ProfileView, User } = require("../models");
const QRCode = require("qrcode");
const { deleteImage, cloudinary } = require("../middleware/uploadMiddleware");

const generateUniqueSlug = async (name) => {
  let slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  let counter = 1;
  let uniqueSlug = slug;

  while (await Profile.findOne({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
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
        }
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
      customDesignUrl, // 🆕 NEW: Accept custom design URL
    } = req.body;

    if (!name || !profileType) {
      return res.status(400).json({
        success: false,
        message: "Name and profile type are required",
      });
    }

    const existingProfile = await Profile.findOne({
      where: { userId, profileType },
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${profileType} profile. Please update it instead.`,
      });
    }

    const slug = await generateUniqueSlug(name);
    const profileUrl = `https://linkme.io/${slug}`;

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
      template: template || "modern",
      customDesignUrl: customDesignUrl || null, // 🆕 NEW: Store custom design
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
      customDesignUrl, // 🆕 NEW: Accept custom design URL in updates
    } = req.body;

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

    let slug = profile.slug;
    let profileUrl = profile.profileUrl;
    if (name && name !== profile.name) {
      slug = await generateUniqueSlug(name);
      profileUrl = `https://linkme.io/${slug}`;

      const newQrCodeUrl = await generateAndUploadQR(profileUrl, userId);
      if (newQrCodeUrl) {
        if (profile.qrCodeUrl) {
          await deleteImage(profile.qrCodeUrl);
        }
        profile.qrCodeUrl = newQrCodeUrl;
      }
    }

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
      // 🆕 NEW: Update custom design URL
      customDesignUrl:
        customDesignUrl !== undefined
          ? customDesignUrl
          : profile.customDesignUrl,
      slug,
      profileUrl,
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
// 🆕 ADD THIS FUNCTION
exports.uploadTempDesign = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // File is already uploaded to Cloudinary by the uploadProfile middleware
    res.status(200).json({
      success: true,
      message: "Design uploaded successfully",
      url: req.file.path,
    });
  } catch (error) {
    console.error("Error uploading temp design:", error);
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
      parseInt(days)
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
