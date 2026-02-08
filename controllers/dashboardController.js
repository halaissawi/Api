const { Profile, SocialLink, sequelize, UserProduct, Product } = require("../models");
const { Op } = require("sequelize");

exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get profiles (digital profiles created for free)
    const profiles = await Profile.findAll({
      where: { userId },
      attributes: [
        "id",
        "name",
        "profileType",
        "viewCount",
        "isActive",
        "createdAt",
      ],
      order: [["viewCount", "DESC"]],
    });

    // 🆕 Get user products (purchased items)
    const userProducts = await UserProduct.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "productType", "platform", "category"],
        },
      ],
      attributes: [
        "id",
        "nickname",
        "productType",
        "isActive",
        "setupComplete",
        "createdAt",
      ],
    });

    // Calculate profile stats
    const totalViews = profiles.reduce(
      (sum, profile) => sum + (profile.viewCount || 0),
      0,
    );

    const profileIds = profiles.map((p) => p.id);

    let totalClicks = 0;
    if (profileIds.length > 0) {
      const clicksResult = await SocialLink.sum("clickCount", {
        where: {
          profileId: {
            [Op.in]: profileIds,
          },
        },
      });
      totalClicks = clicksResult || 0;
    }

    // Calculate combined stats
    const activeProfiles = profiles.filter((p) => p.isActive).length;
    const activeUserProducts = userProducts.filter((up) => up.isActive).length;
    const totalActive = activeProfiles + activeUserProducts;

    const totalProfiles = profiles.length;
    const totalUserProducts = userProducts.length;
    const totalProducts = totalProfiles + totalUserProducts;

    // Map profiles for display
    const profilesData = profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      type: profile.profileType,
      views: profile.viewCount || 0,
    }));

    // 🆕 Product breakdown by type
    const breakdown = {
      digitalProfiles: totalProfiles,
      purchasedProducts: totalUserProducts,
      socialCards: userProducts.filter(
        (up) => up.product?.productType === "social_link",
      ).length,
      menuStands: userProducts.filter(
        (up) => up.product?.productType === "menu",
      ).length,
      reviewStands: userProducts.filter(
        (up) => up.product?.productType === "review",
      ).length,
      bracelets: userProducts.filter(
        (up) =>
          up.product?.productType === "profile" &&
          up.product?.category === "Bracelet",
      ).length,
    };

    res.status(200).json({
      success: true,
      data: {
        totalProfiles: totalProducts, // 🆕 Combined total
        totalViews: totalViews,
        totalClicks: totalClicks,
        activeProfiles: totalActive, // 🆕 Combined active count
        profiles: profilesData,
        breakdown: breakdown, // 🆕 Product type breakdown
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
};

exports.getProfileAnalytics = async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user.id;

    const profile = await Profile.findOne({
      where: {
        id: profileId,
        userId: userId,
      },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const analytics = await profile.getAnalytics(sequelize.models);

    res.status(200).json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          name: profile.name,
          type: profile.profileType,
        },
        analytics: analytics,
      },
    });
  } catch (error) {
    console.error("Error fetching profile analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile analytics",
      error: error.message,
    });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const recentUpdates = await Profile.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]],
      limit: limit,
      attributes: [
        "id",
        "name",
        "profileType",
        "updatedAt",
        "viewCount",
        "isActive",
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        recentUpdates: recentUpdates || [],
      },
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity",
      error: error.message,
    });
  }
};
