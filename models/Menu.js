const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    static associate(models) {
      Menu.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }

    static generateRandomCode(length = 6) {
      const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
      let code = "";
      for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return code;
    }

    static async generateUniqueSlug(length = 6) {
      let slug;
      let attempts = 0;
      const maxAttempts = 10;
      let currentLength = length;

      do {
        slug = Menu.generateRandomCode(currentLength);
        const existingMenu = await Menu.findOne({ where: { uniqueSlug: slug } });

        if (!existingMenu) break;

        attempts++;
        if (attempts >= maxAttempts) {
          currentLength++;
          attempts = 0;
        }
        if (currentLength > 10) {
          throw new Error("Unable to generate unique slug");
        }
      } while (true);

      return slug;
    }
  }

  Menu.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      restaurantName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tagline: DataTypes.STRING,
      cuisineType: DataTypes.STRING,
      logo: DataTypes.STRING,
      coverImage: DataTypes.STRING,
      phone: DataTypes.STRING,
      email: DataTypes.STRING,
      address: DataTypes.STRING,
      website: DataTypes.STRING,
      categories: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      theme: {
        type: DataTypes.JSON,
        defaultValue: {
          primaryColor: "#f2a91d",
          layout: "modern",
          fontFamily: "Inter",
        },
      },
      social: {
        type: DataTypes.JSON,
        defaultValue: {
          facebook: "",
          instagram: "",
          twitter: "",
        },
      },
      uniqueSlug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "active",
      },
    },
    {
      sequelize,
      modelName: "Menu",
      tableName: "Menus",
    }
  );

  return Menu;
};
