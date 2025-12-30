"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Profiles", "pageTemplate", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "modern",
    });

    await queryInterface.addColumn("Profiles", "pageColor", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "#0EA5E9",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Profiles", "pageTemplate");
    await queryInterface.removeColumn("Profiles", "pageColor");
  },
};
