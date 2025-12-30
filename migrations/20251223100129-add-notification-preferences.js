"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable("Profiles");

    if (!tableDescription.emailNotifications) {
      await queryInterface.addColumn("Profiles", "emailNotifications", {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      });
    }

    if (!tableDescription.profileViews) {
      await queryInterface.addColumn("Profiles", "profileViews", {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      });
    }

    if (!tableDescription.newContacts) {
      await queryInterface.addColumn("Profiles", "newContacts", {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      });
    }

    console.log("✅ Notification preference columns added successfully");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Profiles", "emailNotifications");
    await queryInterface.removeColumn("Profiles", "profileViews");
    await queryInterface.removeColumn("Profiles", "newContacts");
    console.log("✅ Notification preference columns removed successfully");
  },
};
