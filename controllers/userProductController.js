const { UserProduct, Product, User } = require("../models");
const crypto = require("crypto");

// Generate unique NFC code
const generateNfcCode = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Create/Purchase a product
exports.purchaseProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    // Create user product entry
    const userProduct = await UserProduct.create({
      userId,
      productId,
      productType: product.productType,
      nfcCode: generateNfcCode(),
      setupComplete: false,
      nickname: product.name,
      isPaid: req.body.isPaid || false,
    });

    res.status(201).json({
      success: true,
      message: "Product purchased successfully",
      data: userProduct,
    });
  } catch (error) {
    console.error("Error purchasing product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to purchase product",
      error: error.message,
    });
  }
};

// Get all user products
exports.getUserProducts = async (req, res) => {
  try {
    const userId = req.user.id;

    const userProducts = await UserProduct.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "category", "image", "productType", "platform"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: userProducts.length,
      data: userProducts,
    });
  } catch (error) {
    console.error("Error fetching user products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get single user product
exports.getUserProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const userProduct = await UserProduct.findOne({
      where: { id, userId },
      include: [
        {
          model: Product,
          as: "product",
        },
      ],
    });

    if (!userProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: userProduct,
    });
  } catch (error) {
    console.error("Error fetching user product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// Setup/Update user product
exports.setupUserProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { nickname, profileType, profileData, designChoice } = req.body;

    const userProduct = await UserProduct.findOne({
      where: { id, userId },
    });

    if (!userProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await userProduct.update({
      nickname: nickname || userProduct.nickname,
      profileType: profileType || userProduct.profileType,
      profileData: profileData || userProduct.profileData,
      designChoice: designChoice || userProduct.designChoice,
      setupComplete: true,
    });

    res.status(200).json({
      success: true,
      message: "Product setup completed successfully",
      data: userProduct,
    });
  } catch (error) {
    console.error("Error setting up product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to setup product",
      error: error.message,
    });
  }
};

// Delete user product
exports.deleteUserProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const userProduct = await UserProduct.findOne({
      where: { id, userId },
    });

    if (!userProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await userProduct.destroy();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// Toggle product status
exports.toggleUserProductStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const userProduct = await UserProduct.findOne({
      where: { id, userId },
    });

    if (!userProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await userProduct.update({
      isActive: !userProduct.isActive,
    });

    res.status(200).json({
      success: true,
      message: `Product ${userProduct.isActive ? "activated" : "deactivated"} successfully`,
      data: userProduct,
    });
  } catch (error) {
    console.error("Error toggling product status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle product status",
      error: error.message,
    });
  }
};

// Get public product details (No Auth)
exports.getPublicUserProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const userProduct = await UserProduct.findOne({
      where: { 
        id,
        isActive: true
      },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "category", "image", "productType", "platform"],
        },
      ],
      attributes: ['id', 'productType', 'nickname', 'profileData', 'setupComplete', 'isActive', 'profileType']
    });

    if (!userProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    // Block access to unpaid menu links
    if (userProduct.productType === 'menu' && !userProduct.isPaid) {
      return res.status(403).json({
        success: false,
        message: "Access to this menu requires a physical NFC stand purchase.",
        error: "PURCHASE_REQUIRED"
      });
    }

    res.status(200).json({
      success: true,
      data: userProduct,
    });
  } catch (error) {
    console.error("Error fetching public product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};
