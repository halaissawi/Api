"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Orders_cardDesignMode" ADD VALUE IF NOT EXISTS 'template';
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Orders_cardDesignMode" ADD VALUE IF NOT EXISTS 'upload';
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Orders_cardDesignMode" ADD VALUE IF NOT EXISTS 'custom';
    `);
  },

  async down() {
    // Postgres ما بيسمح بسهولة بحذف enum value
  },
};
