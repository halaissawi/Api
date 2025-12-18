"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // For PostgreSQL - Add new value to existing ENUM type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Profiles_designMode" ADD VALUE IF NOT EXISTS 'template';
    `);

    console.log('✅ Successfully added "template" to designMode enum');
  },

  async down(queryInterface, Sequelize) {
    // Note: Cannot easily remove ENUM values in PostgreSQL
    console.log(
      "⚠️ Rollback: Cannot remove ENUM values in PostgreSQL without recreating the type"
    );
  },
};
