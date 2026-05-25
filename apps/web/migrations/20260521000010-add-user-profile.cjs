"use strict";

// Public profile fields powering the link-in-bio page at /u/[username].
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "username", {
      type: Sequelize.STRING(32),
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn("users", "bio", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "bio");
    await queryInterface.removeColumn("users", "username");
  },
};
