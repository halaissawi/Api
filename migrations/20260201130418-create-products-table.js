"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("products", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM("Cards", "Accessories"),
        allowNull: false,
        defaultValue: "Cards",
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      originalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      rating: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: false,
        defaultValue: 5.0,
      },
      reviews: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      badge: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      features: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      inStock: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      discount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex("products", ["category"]);
    await queryInterface.addIndex("products", ["inStock"]);
    await queryInterface.addIndex("products", ["isActive"]);
    await queryInterface.addIndex("products", ["order"]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex("products", ["category"]);
    await queryInterface.removeIndex("products", ["inStock"]);
    await queryInterface.removeIndex("products", ["isActive"]);
    await queryInterface.removeIndex("products", ["order"]);

    // Drop the table
    await queryInterface.dropTable("products");
  },
};
