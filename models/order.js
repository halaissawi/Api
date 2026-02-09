"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Belongs to User
      Order.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // ✅ NEW: Has many OrderItems
      Order.hasMany(models.OrderItem, {
        foreignKey: "orderId",
        as: "items",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // ✅ CHANGED: Profile is now optional (for backward compatibility)
      Order.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "profile",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }

    // Instance method to update order status
    async updateStatus(newStatus) {
      this.orderStatus = newStatus;

      if (newStatus === "delivered") {
        this.deliveredAt = new Date();
      } else if (newStatus === "shipped") {
        this.shippedAt = new Date();
      }

      await this.save();
      return this;
    }

    // Static method to get orders by status
    static async getOrdersByStatus(status) {
      return await Order.findAll({
        where: { orderStatus: status },
        include: [
          {
            model: sequelize.models.User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "email", "phoneNumber"],
          },
          {
            model: sequelize.models.OrderItem,
            as: "items",
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }
  }

  Order.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: { msg: "Order number is required" },
          notEmpty: { msg: "Order number cannot be empty" },
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "User ID is required" },
        },
      },
      
      // ✅ CHANGED: Made optional for multi-item orders
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Changed from false to true
      },
      profileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Customer Information
      customerFirstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerLastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: { msg: "Must be a valid email address" },
        },
      },
      customerPhone: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // ✅ CHANGED: Made optional (moved to OrderItem level)
      cardType: {
        type: DataTypes.ENUM("personal", "business"),
        allowNull: true, // Changed from false to true
      },
      cardColor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cardTemplate: {
        type: DataTypes.STRING,
        allowNull: true, // Changed from false to true
      },
      cardDesignMode: {
        type: DataTypes.ENUM("manual", "ai", "template", "upload", "custom"),
        allowNull: true, // Changed from false to true
      },
      cardAiBackground: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customDesignUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Shipping Information
      shippingAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shippingCity: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shippingCountry: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Jordan",
      },
      shippingNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Payment Information
      paymentMethod: {
        type: DataTypes.ENUM("cash_on_delivery", "online"),
        allowNull: false,
        defaultValue: "cash_on_delivery",
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      // Order Status
      orderStatus: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
      },

      // Timestamps
      shippedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Admin notes
      adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "Orders",
      timestamps: true,
      hooks: {
        beforeValidate: async (order) => {
          // Generate unique order number
          if (!order.orderNumber) {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            order.orderNumber = `ORD-${timestamp}-${random}`;
          }
        },
      },
      indexes: [
        { fields: ["userId"] },
        { fields: ["profileId"] },
        { unique: true, fields: ["orderNumber"] },
        { fields: ["orderStatus"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  return Order;
};