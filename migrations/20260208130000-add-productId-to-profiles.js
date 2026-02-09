'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding
    const tableDescription = await queryInterface.describeTable('Profiles');
    
    if (!tableDescription.productId) {
      await queryInterface.addColumn('Profiles', 'productId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Profiles');
    
    if (tableDescription.productId) {
      await queryInterface.removeColumn('Profiles', 'productId');
    }
  }
};