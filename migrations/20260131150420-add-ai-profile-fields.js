"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Profiles", "customProfileDesign", {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "AI-generated custom profile page design configuration",
    });

    await queryInterface.addColumn("Profiles", "skills", {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "User skills array (for AI-generated profiles)",
    });

    await queryInterface.addColumn("Profiles", "experience", {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "User work experience array (for AI-generated profiles)",
    });

    await queryInterface.addColumn("Profiles", "education", {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "User education array (for AI-generated profiles)",
    });

    console.log("✅ Added AI profile fields to Profiles table");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Profiles", "customProfileDesign");
    await queryInterface.removeColumn("Profiles", "skills");
    await queryInterface.removeColumn("Profiles", "experience");
    await queryInterface.removeColumn("Profiles", "education");

    console.log("✅ Removed AI profile fields from Profiles table");
  },
};
