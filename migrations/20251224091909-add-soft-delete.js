// migrations/YYYYMMDDHHMMSS-add-soft-delete.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add deletedAt to Users table
    await queryInterface.addColumn("Users", "deletedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add deletedAt to Profiles table
    await queryInterface.addColumn("Profiles", "deletedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    console.log("✅ Added deletedAt columns for soft delete");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Users", "deletedAt");
    await queryInterface.removeColumn("Profiles", "deletedAt");
  },
};
