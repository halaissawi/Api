"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Profiles", "customDesignUrl", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "URL of custom uploaded card design image",
    });

    console.log("✅ Added customDesignUrl column to Profiles table");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Profiles", "customDesignUrl");
    console.log("✅ Removed customDesignUrl column from Profiles table");
  },
};
