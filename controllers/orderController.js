const { Order, OrderItem, User, Profile, Product, UserProduct } = require("../models");
const { Sequelize } = require("sequelize");

// ==================== USER ENDPOINTS ====================

exports.createOrder = async (req, res) => {
  const transaction = await require("../models").sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const { items, customerInfo, shippingInfo, paymentMethod, totalAmount } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    console.log("📦 Creating order for user:", userId);
    console.log("📦 Items:", items.length);

    // Create the order
    const order = await Order.create(
      {
        userId,
        customerFirstName: customerInfo.firstName,
        customerLastName: customerInfo.lastName,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        shippingAddress: shippingInfo.address,
        shippingCity: shippingInfo.city,
        shippingCountry: shippingInfo.country || "Jordan",
        shippingNotes: shippingInfo.notes || null,
        paymentMethod: paymentMethod || "cash_on_delivery",
        totalAmount: totalAmount || 0,
        orderStatus: "pending",
      },
      { transaction }
    );

    console.log("✅ Order created:", order.orderNumber);

    // Process each item
    const orderItems = [];
    for (const item of items) {
      let userProductId = null;
      let profileId = null;
      let itemStatus = "pending";

      // ===== DIGITAL PRODUCTS (social_link, menu, review) =====
      if (["social_link", "menu", "review"].includes(item.productType)) {
        console.log(`🔷 Processing digital product: ${item.productName}`);

        try {
          // 1. Purchase the digital product
          const purchaseRes = await UserProduct.create(
            {
              userId,
              productId: item.productId,
              productType: item.productType,
              nickname: item.setupData?.nickname || item.productName,
              isPaid: true,
              setupComplete: !!item.setupData?.url,
              profileData: item.setupData ? {
                url: item.setupData.url,
                platform: item.setupData.platform,
                googleReviewUrl: item.productType === "review" ? item.setupData.url : undefined,
              } : {},
            },
            { transaction }
          );

          userProductId = purchaseRes.id;
          itemStatus = item.setupData?.url ? "activated" : "pending";

          console.log(`✅ Digital product activated: ${userProductId}`);
        } catch (err) {
          console.error(`❌ Failed to activate digital product:`, err);
          // Continue with order but mark as pending
        }
      }
      
      // ===== PHYSICAL PRODUCTS (profile cards, accessories) =====
      else if (item.productType === "profile" || item.profileId) {
        console.log(`📦 Processing physical product: ${item.productName}`);
        profileId = item.profileId;
        itemStatus = "manufacturing";
      }

      // Create order item record
      const orderItem = await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          profileId,
          userProductId,
          productName: item.productName,
          productType: item.productType,
          productCategory: item.productCategory,
          image: item.image,
          quantity: item.quantity || 1,
          price: item.price || 0,
          subtotal: (item.quantity || 1) * (item.price || 0),
          setupData: item.setupData || null,
          cardDesign: item.cardDesign || null,
          itemStatus,
        },
        { transaction }
      );

      orderItems.push(orderItem);
    }

    await transaction.commit();

    // Fetch complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image", "productType"],
            },
            {
              model: Profile,
              as: "profile",
              attributes: ["id", "name", "avatarUrl"],
            },
            {
              model: UserProduct,
              as: "userProduct",
              attributes: ["id", "nickname", "setupComplete"],
            },
          ],
        },
      ],
    });

    console.log("🎉 Order completed successfully:", order.orderNumber);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderNumber: order.orderNumber,
      data: completeOrder,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image", "productType"],
            },
            {
              model: Profile,
              as: "profile",
              attributes: ["id", "name", "avatarUrl"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image", "productType"],
            },
            {
              model: Profile,
              as: "profile",
              attributes: ["id", "name", "avatarUrl", "color", "template"],
            },
            {
              model: UserProduct,
              as: "userProduct",
              attributes: ["id", "nickname", "setupComplete", "profileData"],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// ==================== ADMIN ENDPOINTS ====================

exports.getAllOrders = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const whereClause = status ? { orderStatus: status } : {};

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email", "phoneNumber"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        total: orders.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, adminNotes } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.updateStatus(status);
    if (adminNotes !== undefined) {
      order.adminNotes = adminNotes;
      await order.save();
    }

    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: OrderItem,
          as: "items",
        },
      ],
    });

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

exports.getOrderStatistics = async (req, res) => {
  try {
    const ordersByStatus = await Order.findAll({
      attributes: [
        "orderStatus",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: ["orderStatus"],
      raw: true,
    });

    const totalRevenue = await Order.sum("totalAmount", {
      where: { orderStatus: ["delivered"] },
    });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const ordersThisMonth = await Order.count({
      where: {
        createdAt: { [Sequelize.Op.gte]: currentMonth },
      },
    });

    const recentOrders = await Order.findAll({
      limit: 10,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
        },
        {
          model: OrderItem,
          as: "items",
        },
      ],
    });

    res.json({
      success: true,
      data: {
        ordersByStatus,
        totalRevenue: totalRevenue || 0,
        ordersThisMonth,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching order statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message,
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.destroy();

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};