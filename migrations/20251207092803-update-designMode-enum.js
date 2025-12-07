"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update the ENUM type to include 'custom'
    await queryInterface.sequelize.query(`
      ALTER TABLE "Profiles" 
      DROP CONSTRAINT IF EXISTS "Profiles_designMode_check";
    `);

    await queryInterface.changeColumn("Profiles", "designMode", {
      type: Sequelize.ENUM("manual", "ai", "custom"),
      allowNull: false,
      defaultValue: "manual",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to original ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE "Profiles" 
      DROP CONSTRAINT IF EXISTS "Profiles_designMode_check";
    `);

    await queryInterface.changeColumn("Profiles", "designMode", {
      type: Sequelize.ENUM("manual", "ai"),
      allowNull: false,
      defaultValue: "manual",
    });
  },
};
