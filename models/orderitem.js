"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      // Belongs to Order
      OrderItem.belongsTo(models.Order, {
        foreignKey: "orderId",
        as: "order",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Belongs to Product (optional - for catalog products)
      OrderItem.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });

      // Belongs to Profile (optional - for physical cards)
      OrderItem.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "profile",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });

      // Belongs to UserProduct (optional - for digital products)
      OrderItem.belongsTo(models.UserProduct, {
        foreignKey: "userProductId",
        as: "userProduct",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  }

  OrderItem.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id",
        },
      },
      
      // Product References
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Reference to catalog product",
      },
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Reference to user profile (for physical cards)",
      },
      userProductId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Reference to activated digital product",
      },

      // Item Details (snapshot at time of order)
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      productType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "profile, social_link, menu, review, etc.",
      },
      productCategory: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Pricing
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      // Setup Data (for digital products)
      setupData: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Setup configuration for digital products",
      },

      // Card Design (for physical cards)
      cardDesign: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Card design details for physical products",
      },

      // Status
      itemStatus: {
        type: DataTypes.ENUM(
          "pending",
          "activated",
          "manufacturing",
          "shipped",
          "delivered",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
      tableName: "OrderItems",
      timestamps: true,
      hooks: {
        beforeSave: (item) => {
          // Calculate subtotal
          item.subtotal = item.quantity * item.price;
        },
      },
    }
  );

  return OrderItem;
};