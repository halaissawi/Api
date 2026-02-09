'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding
    const tableDescription = await queryInterface.describeTable('user_products');
    
    if (!tableDescription.isPaid) {
      await queryInterface.addColumn('user_products', 'isPaid', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('user_products');
    
    if (tableDescription.isPaid) {
      await queryInterface.removeColumn('user_products', 'isPaid');
    }
  }
};