const { Menu } = require("../models");

exports.createMenu = async (req, res) => {
  try {
    const userId = req.user.id;
    const menuData = req.body;

    const uniqueSlug = await Menu.generateUniqueSlug();

    const menu = await Menu.create({
      ...menuData,
      userId,
      uniqueSlug,
    });

    res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: menu,
    });
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create menu",
    });
  }
};

exports.getMyMenus = async (req, res) => {
  try {
    const userId = req.user.id;
    const menus = await Menu.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: menus,
    });
  } catch (error) {
    console.error("Error fetching my menus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menus",
    });
  }
};

exports.getMenuBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const menu = await Menu.findOne({
      where: { uniqueSlug: slug },
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error) {
    console.error("Error fetching menu by slug:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu",
    });
  }
};
exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const menuData = req.body;

    const menu = await Menu.findOne({ where: { id, userId } });
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    await menu.update(menuData);

    res.status(200).json({
      success: true,
      message: "Menu updated successfully",
      data: menu,
    });
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update menu",
    });
  }
};

exports.toggleMenuStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const menu = await Menu.findOne({ where: { id, userId } });
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    const newStatus = menu.status === "active" ? "inactive" : "active";
    await menu.update({ status: newStatus });

    res.status(200).json({
      success: true,
      message: `Menu ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      data: menu,
    });
  } catch (error) {
    console.error("Error toggling menu status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle menu status",
    });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const menu = await Menu.findOne({ where: { id, userId } });
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    await menu.destroy();

    res.status(200).json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting menu:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete menu",
    });
  }
};

exports.getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const menu = await Menu.findOne({ where: { id, userId } });
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error) {
    console.error("Error fetching menu by id:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu",
    });
  }
};
