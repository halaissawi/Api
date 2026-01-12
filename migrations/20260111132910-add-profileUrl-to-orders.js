module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Orders", "profileUrl", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Public profile URL for the NFC card",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Orders", "profileUrl");
  },
};
