"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Orders", "cardCustomDesignUrl", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Custom card design uploaded by user at time of order",
    });

    console.log("✅ Added cardCustomDesignUrl column to Orders table");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Orders", "cardCustomDesignUrl");
    console.log("✅ Removed cardCustomDesignUrl column from Orders table");
  },
};
