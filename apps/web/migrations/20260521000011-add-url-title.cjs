"use strict";

// Optional human-friendly label for a link (shown on link-in-bio pages).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("urls", "title", {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("urls", "title");
  },
};
