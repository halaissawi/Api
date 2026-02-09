'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if Products table exists
    const tables = await queryInterface.showAllTables();
    const hasProducts = tables.includes('Products');
    const hasProfiles = tables.includes('Profiles');
    const hasUserProducts = tables.includes('user_products');

    // Create OrderItems table
    await queryInterface.createTable('OrderItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        // Only add reference if Products table exists
        ...(hasProducts && {
          references: {
            model: 'Products',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        })
      },
      profileId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        ...(hasProfiles && {
          references: {
            model: 'Profiles',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        })
      },
      userProductId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        ...(hasUserProducts && {
          references: {
            model: 'user_products',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        })
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      productType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      productCategory: {
        type: Sequelize.STRING,
        allowNull: true
      },
      image: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0
      },
      setupData: {
        type: Sequelize.JSON,
        allowNull: true
      },
      cardDesign: {
        type: Sequelize.JSON,
        allowNull: true
      },
      itemStatus: {
        type: Sequelize.ENUM(
          'pending',
          'activated',
          'manufacturing',
          'shipped',
          'delivered',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Update Orders table - make fields nullable
    try {
      const ordersTable = await queryInterface.describeTable('Orders');
      
      if (ordersTable.profileId && !ordersTable.profileId.allowNull) {
        await queryInterface.changeColumn('Orders', 'profileId', {
          type: Sequelize.INTEGER,
          allowNull: true
        });
      }

      if (ordersTable.cardType && !ordersTable.cardType.allowNull) {
        await queryInterface.changeColumn('Orders', 'cardType', {
          type: Sequelize.ENUM('personal', 'business'),
          allowNull: true
        });
      }

      if (ordersTable.cardTemplate && !ordersTable.cardTemplate.allowNull) {
        await queryInterface.changeColumn('Orders', 'cardTemplate', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }

      if (ordersTable.cardDesignMode && !ordersTable.cardDesignMode.allowNull) {
        await queryInterface.changeColumn('Orders', 'cardDesignMode', {
          type: Sequelize.ENUM('manual', 'ai', 'template', 'upload', 'custom'),
          allowNull: true
        });
      }
    } catch (error) {
      console.log('Note: Some Orders table updates may have failed, but continuing...');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('OrderItems');
    
    // Revert Orders table changes
    try {
      await queryInterface.changeColumn('Orders', 'profileId', {
        type: Sequelize.INTEGER,
        allowNull: false
      });
    } catch (error) {
      console.log('Could not revert Orders.profileId');
    }
  }
};