"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add userId column
    await queryInterface.addColumn("ProfileVisitors", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null for existing records
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE", // If user is deleted, delete their contacts
      onUpdate: "CASCADE",
    });

    // Populate userId for existing records based on their profile's userId
    await queryInterface.sequelize.query(`
      UPDATE "ProfileVisitors" 
      SET "userId" = "Profiles"."userId"
      FROM "Profiles"
      WHERE "ProfileVisitors"."profileId" = "Profiles"."id"
      AND "ProfileVisitors"."userId" IS NULL;
    `);

    // Add index for performance
    await queryInterface.addIndex("ProfileVisitors", ["userId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ProfileVisitors", "userId");
  },
};
