module.exports = (sequelize, DataTypes) => {
  const UserProduct = sequelize.define(
    "UserProduct",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nickname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      productType: {
        type: DataTypes.ENUM("social_link", "menu", "review", "profile"),
        allowNull: false,
      },
      setupComplete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      profileType: {
        type: DataTypes.ENUM("personal", "business"),
        allowNull: true,
      },
      profileData: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      designChoice: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nfcCode: {
        type: DataTypes.STRING,
        unique: true,
      },
      isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "user_products",
      timestamps: true,
    },
  );

  UserProduct.associate = (models) => {
    UserProduct.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    UserProduct.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
  };

  return UserProduct;
};
