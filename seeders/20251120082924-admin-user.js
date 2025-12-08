"use strict";

const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if admin already exists
    const existingAdmin = await queryInterface.sequelize.query(
      `SELECT email FROM "Users" WHERE email = 'admin@example.com' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Only insert if it doesn't exist
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash("Admin@123", 10);

      await queryInterface.bulkInsert("Users", [
        {
          firstName: "System",
          secondName: null,
          lastName: "Admin",
          phoneNumber: "0000000000",
          dateOfBirth: "1990-01-01",
          isVerified: true,
          email: "admin@example.com",
          password: hashedPassword,
          role: "admin",
          otp: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          googleId: null,
          facebookId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      console.log("✅ Admin user seeded successfully");
    } else {
      console.log("ℹ️ Admin user already exists, skipping...");
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Users", { email: "admin@example.com" });
  },
};
