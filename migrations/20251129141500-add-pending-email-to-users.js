"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if the column already exists
    const tableDescription = await queryInterface.describeTable("Users");

    if (!tableDescription.pendingEmail) {
      console.log("Adding pendingEmail column to Users table...");
      await queryInterface.addColumn("Users", "pendingEmail", {
        type: Sequelize.STRING,
        allowNull: true,
      });
      console.log("✅ Successfully added pendingEmail column!");
    } else {
      console.log("ℹ️ pendingEmail column already exists, skipping...");
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "pendingEmail");
  },
};
