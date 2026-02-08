"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new categories to enum
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TYPE "enum_products_category" ADD VALUE IF NOT EXISTS 'Table Stand';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        ALTER TYPE "enum_products_category" ADD VALUE IF NOT EXISTS 'Bracelet';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add productType column
    await queryInterface.addColumn("products", "productType", {
      type: Sequelize.ENUM("social_link", "menu", "review", "profile"),
      allowNull: false,
      defaultValue: "profile",
    });

    // Add platform column (for social media products)
    await queryInterface.addColumn("products", "platform", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "For social_link type: facebook, instagram, youtube, snapchat",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("products", "productType");
    await queryInterface.removeColumn("products", "platform");
  },
};
