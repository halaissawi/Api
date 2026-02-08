const { Product } = require("../models");
const { Op } = require("sequelize");

// Get all products (public)
exports.getAllProducts = async (req, res) => {
  try {
    const { category, inStock } = req.query;

    const whereClause = { isActive: true };

    if (category && category !== "All") {
      whereClause.category = category;
    }

    if (inStock !== undefined) {
      whereClause.inStock = inStock === "true";
    }

    const products = await Product.findAll({
      where: whereClause,
      order: [
        ["order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get all products (admin - includes inactive)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { category, inStock, search } = req.query;

    const whereClause = {};

    if (category && category !== "All") {
      whereClause.category = category;
    }

    if (inStock !== undefined) {
      whereClause.inStock = inStock === "true";
    }

    if (search) {
      whereClause.name = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const products = await Product.findAll({
      where: whereClause,
      order: [
        ["order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// Create product (admin only)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      productType, // ADD THIS
      platform, // ADD THIS
      price,
      originalPrice,
      image,
      rating,
      reviews,
      badge,
      features,
      inStock,
      discount,
      order,
    } = req.body;
    // Validation
    if (!name || !category || !price || !image || !features) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const product = await Product.create({
      name,
      category,
      productType: productType || "profile", // ADD THIS
      platform: platform || null, // ADD THIS
      price,
      originalPrice,
      image,
      rating: rating || 5.0,
      reviews: reviews || 0,
      badge,
      features,
      inStock: inStock !== undefined ? inStock : true,
      discount,
      order: order || 0,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// Update product (admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      productType, // ADD THIS
      platform, // ADD THIS
      price,
      originalPrice,
      image,
      rating,
      reviews,
      badge,
      features,
      inStock,
      discount,
      isActive,
      order,
    } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.update({
      name: name || product.name,
      category: category || product.category,
      productType: productType || product.productType, // ADD THIS
      platform: platform !== undefined ? platform : product.platform, // ADD THIS
      price: price !== undefined ? price : product.price,
      originalPrice:
        originalPrice !== undefined ? originalPrice : product.originalPrice,
      image: image || product.image,
      rating: rating !== undefined ? rating : product.rating,
      reviews: reviews !== undefined ? reviews : product.reviews,
      badge: badge !== undefined ? badge : product.badge,
      features: features || product.features,
      inStock: inStock !== undefined ? inStock : product.inStock,
      discount: discount !== undefined ? discount : product.discount,
      isActive: isActive !== undefined ? isActive : product.isActive,
      order: order !== undefined ? order : product.order,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.destroy();

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

// Toggle product status (admin only)
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.update({
      isActive: !product.isActive,
    });

    res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
      data: product,
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

// Update product order (admin only)
exports.updateProductOrder = async (req, res) => {
  try {
    const { products } = req.body; // Array of { id, order }

    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: "Invalid products array",
      });
    }

    await Promise.all(
      products.map(({ id, order }) =>
        Product.update({ order }, { where: { id } }),
      ),
    );

    res.status(200).json({
      success: true,
      message: "Product order updated successfully",
    });
  } catch (error) {
    console.error("Error updating product order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product order",
      error: error.message,
    });
  }
};
