"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    static associate(models) {
      // Belongs to User
      Profile.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Has many SocialLinks
      Profile.hasMany(models.SocialLink, {
        foreignKey: "profileId",
        as: "socialLinks",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Has many ProfileViews
      Profile.hasMany(models.ProfileView, {
        foreignKey: "profileId",
        as: "views",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Profile.hasMany(models.Order, {
        foreignKey: "profileId",
        as: "orders",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });

      // ✅ NEW: Belongs to Product
      Profile.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }

    // Instance method to increment view count
    async incrementViewCount() {
      this.viewCount += 1;
      await this.save();
      return this.viewCount;
    }

    // Instance method to get analytics summary
    async getAnalytics(models) {
      const totalViews = await models.ProfileView.count({
        where: { profileId: this.id },
      });

      const viewsBySource = await models.ProfileView.findAll({
        where: { profileId: this.id },
        attributes: [
          "viewSource",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["viewSource"],
        raw: true,
      });

      const totalClicks = await models.SocialLink.sum("clickCount", {
        where: { profileId: this.id },
      });

      return {
        totalViews,
        viewsBySource,
        totalClicks: totalClicks || 0,
      };
    }

    // Instance method to generate profile URL
    generateProfileUrl() {
      return `https://www.linkmejo.com/u/${this.slug}`;
    }
    // ✅ LEGACY: Name-based slug generation (kept for backward compatibility)
    static async generateUniqueSlug(name) {
      let slug = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      // Check if slug exists (excluding soft-deleted profiles)
      const existingProfile = await Profile.findOne({
        where: {
          slug,
          deletedAt: null,
        },
      });

      if (existingProfile) {
        // Add random number to make it unique
        const randomNum = Math.floor(Math.random() * 10000);
        slug = `${slug}-${randomNum}`;
      }

      return slug;
    }

    // ✅ NEW: Generate random alphanumeric code
    static generateRandomCode(length = 6) {
      const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
      let code = "";

      for (let i = 0; i < length; i++) {
        code += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }

      return code;
    }

    // ✅ NEW: Generate unique random slug (PRIMARY METHOD)
    static async generateUniqueRandomSlug(length = 6) {
      let slug;
      let attempts = 0;
      const maxAttempts = 10;
      let currentLength = length;

      do {
        slug = Profile.generateRandomCode(currentLength);

        // Check if slug exists (excluding soft-deleted profiles)
        const existingProfile = await Profile.findOne({
          where: {
            slug,
            deletedAt: null,
          },
        });

        if (!existingProfile) {
          // Slug is unique, we can use it
          console.log(`✅ Generated unique slug: ${slug}`);
          break;
        }

        attempts++;
        console.log(
          `⚠️ Collision detected for slug: ${slug}, attempt ${attempts}`,
        );

        // If too many collisions, increase length
        if (attempts >= maxAttempts) {
          currentLength++;
          attempts = 0;
          console.log(
            `⚠️ Increasing slug length to ${currentLength} due to collisions`,
          );
        }

        // Safety limit - prevent infinite loops
        if (currentLength > 10) {
          throw new Error(
            "Unable to generate unique slug after multiple attempts",
          );
        }
      } while (true);

      return slug;
    }

    // Instance method to get full profile with links
    async getFullProfile() {
      return await Profile.findByPk(this.id, {
        include: [
          {
            model: sequelize.models.SocialLink,
            as: "socialLinks",
            where: { isVisible: true },
            required: false,
            order: [["order", "ASC"]],
          },
        ],
      });
    }

    // Virtual field to check if profile is complete
    get isComplete() {
      return !!(this.name && this.title && this.bio && this.avatarUrl);
    }
  }

  Profile.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "User ID is required",
          },
          notEmpty: {
            msg: "User ID cannot be empty",
          },
        },
      },
      profileType: {
        type: DataTypes.ENUM("personal", "business"),
        allowNull: false,
        defaultValue: "personal",
        validate: {
          isIn: {
            args: [["personal", "business"]],
            msg: "Profile type must be either 'personal' or 'business'",
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Name is required",
          },
          notEmpty: {
            msg: "Name cannot be empty",
          },
          len: {
            args: [2, 100],
            msg: "Name must be between 2 and 100 characters",
          },
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 150],
            msg: "Title must be less than 150 characters",
          },
        },
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: "Bio must be less than 500 characters",
          },
        },
      },
      avatarUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "#0066FF",
        validate: {
          is: {
            args: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            msg: "Color must be a valid hex color code",
          },
        },
      },
      designMode: {
        type: DataTypes.ENUM("manual", "ai", "custom", "template"),
        allowNull: false,
        defaultValue: "manual",
        validate: {
          isIn: {
            args: [["manual", "ai", "custom", "template"]],
            msg: "Design mode must be either 'manual', 'ai', 'custom', or 'template'",
          },
        },
      },
      aiPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: "AI prompt must be less than 500 characters",
          },
        },
      },
      aiBackground: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      template: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "template1",
        comment: "Card design template (template1-6)",
      },
      pageTemplate: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "modern",
        comment: "Public profile page template (modern, minimal, glass, etc.)",
        validate: {
          isIn: {
            args: [
              ["modern", "minimal", "glass", "luxury", "pastel", "cosmic"],
            ],
            msg: "Page template must be one of: modern, minimal, glass, luxury, pastel, cosmic",
          },
        },
      },
      pageColor: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "#0EA5E9",
        comment: "Public profile page color theme",
        validate: {
          is: {
            args: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            msg: "Page color must be a valid hex color code",
          },
        },
      },
      customDesignUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "URL of custom uploaded card design image",
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Soft delete timestamp",
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "This profile URL is already taken",
        },
        validate: {
          notNull: {
            msg: "Slug is required",
          },
          notEmpty: {
            msg: "Slug cannot be empty",
          },
          is: {
            args: /^[a-z0-9-]+$/,
            msg: "Slug must contain only lowercase letters, numbers, and hyphens",
          },
        },
      },
      profileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Profile URL is required",
          },
          isUrl: {
            msg: "Profile URL must be a valid URL",
          },
        },
      },
      qrCodeUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: "QR code URL must be a valid URL",
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      profileViews: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      newContacts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      customProfileDesign: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      skills: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      experience: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      education: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Profile",
      tableName: "Profiles",
      paranoid: true, // ✅ Enables soft delete
      hooks: {
        beforeValidate: async (profile) => {
          // ✅ UPDATED: Generate random slug instead of name-based
          if (!profile.slug && profile.name) {
            profile.slug = await Profile.generateUniqueRandomSlug(6);
            console.log(`🔗 Auto-generated random slug: ${profile.slug}`);
          }

          // Auto-generate profile URL if not provided
          if (!profile.profileUrl && profile.slug) {
            profile.profileUrl = `https://www.linkmejo.com/u/${profile.slug}`;
          }
        },
        afterCreate: async (profile) => {
          console.log(
            `✅ New profile created: ${profile.name} (${profile.slug})`,
          );
        },
      },
      indexes: [
        {
          fields: ["userId"],
        },
        {
          unique: true,
          fields: ["slug"],
        },
        {
          fields: ["profileType"],
        },
      ],
    },
  );

  return Profile;
};
