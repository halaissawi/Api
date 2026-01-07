"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_SocialLinks_platform" 
      ADD VALUE IF NOT EXISTS 'facebook';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Removing enum values is complex, usually we don't do it
  },
};
