"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("user_products", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      nickname: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "User's custom name for this product",
      },
      productType: {
        type: Sequelize.ENUM("social_link", "menu", "review", "profile"),
        allowNull: false,
      },
      setupComplete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // For profile type (card/bracelet)
      profileType: {
        type: Sequelize.ENUM("personal", "business"),
        allowNull: true,
      },
      profileData: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: "Stores all product-specific data: profile, menu, links, etc.",
      },
      // Design choice
      designChoice: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Design selection: white, black, logo, blue, etc.",
      },
      // NFC/QR Code
      nfcCode: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        comment: "Unique code for this product instance",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("user_products", ["userId"]);
    await queryInterface.addIndex("user_products", ["productId"]);
    await queryInterface.addIndex("user_products", ["nfcCode"]);
    await queryInterface.addIndex("user_products", ["setupComplete"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("user_products");
  },
};
