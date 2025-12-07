"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, let's check what constraints exist
    // We'll try different possible constraint names

    try {
      // PostgreSQL: Try to remove the foreign key constraint
      // The constraint name might be different, so we'll use a raw query to find it
      const [results] = await queryInterface.sequelize.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'ProfileVisitors' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%profileId%';
      `);

      if (results.length > 0) {
        const constraintName = results[0].constraint_name;
        console.log("Found constraint:", constraintName);

        // Remove the old constraint
        await queryInterface.removeConstraint(
          "ProfileVisitors",
          constraintName
        );
      }

      // Make profileId nullable first
      await queryInterface.changeColumn("ProfileVisitors", "profileId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });

      // Add new foreign key constraint with SET NULL
      await queryInterface.addConstraint("ProfileVisitors", {
        fields: ["profileId"],
        type: "foreign key",
        name: "ProfileVisitors_profileId_fkey_new",
        references: {
          table: "Profiles",
          field: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });

      console.log("✅ Migration completed successfully!");
    } catch (error) {
      console.error("Migration error:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remove the new constraint
      await queryInterface.removeConstraint(
        "ProfileVisitors",
        "ProfileVisitors_profileId_fkey_new"
      );

      // Make profileId NOT NULL again
      await queryInterface.changeColumn("ProfileVisitors", "profileId", {
        type: Sequelize.INTEGER,
        allowNull: false,
      });

      // Restore the original CASCADE constraint
      await queryInterface.addConstraint("ProfileVisitors", {
        fields: ["profileId"],
        type: "foreign key",
        references: {
          table: "Profiles",
          field: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      console.log("✅ Rollback completed successfully!");
    } catch (error) {
      console.error("Rollback error:", error.message);
      throw error;
    }
  },
};
