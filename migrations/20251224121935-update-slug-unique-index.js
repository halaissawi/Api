// migrations/20241224000000-update-slug-unique-index.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Remove old unique index on slug
      await queryInterface.removeIndex("Profiles", ["slug"]);
      console.log("✅ Removed old unique index on slug");

      // Create partial unique index (only for non-deleted records)
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX profiles_slug_active_unique 
        ON "Profiles" (slug) 
        WHERE "deletedAt" IS NULL;
      `);
      console.log(
        "✅ Created partial unique index on slug (excludes soft-deleted)"
      );
    } catch (error) {
      console.error("❌ Error updating slug index:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove partial index
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS profiles_slug_active_unique;
      `);

      // Restore old unique index
      await queryInterface.addIndex("Profiles", {
        fields: ["slug"],
        unique: true,
        name: "Profiles_slug_unique",
      });
      console.log("✅ Restored original slug index");
    } catch (error) {
      console.error("❌ Error reverting slug index:", error);
      throw error;
    }
  },
};
