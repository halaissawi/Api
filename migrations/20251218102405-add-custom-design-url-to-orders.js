// migrations/YYYYMMDDHHMMSS-add-custom-design-url-to-orders.js

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Orders", "customDesignUrl", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Orders", "customDesignUrl");
  },
};
