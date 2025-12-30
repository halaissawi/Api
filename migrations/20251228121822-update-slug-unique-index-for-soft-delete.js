// migrations/YYYYMMDDHHMMSS-update-slug-unique-index-for-soft-delete.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("🔧 Starting index update...");

      // Remove old unique index
      await queryInterface
        .removeIndex("Profiles", "Profiles_slug_unique")
        .catch(() => {
          // Index might not exist, that's okay
          console.log("ℹ️ Old index not found, continuing...");
        });

      // For PostgreSQL: Create partial unique index
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_active_unique 
        ON "Profiles" (slug) 
        WHERE "deletedAt" IS NULL;
      `);

      console.log("✅ Index updated successfully");
    } catch (error) {
      console.error("❌ Error updating index:", error);
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

      console.log("✅ Index reverted successfully");
    } catch (error) {
      console.error("❌ Error reverting index:", error);
      throw error;
    }
  },
};
