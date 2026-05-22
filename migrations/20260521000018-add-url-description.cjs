"use strict";

// Optional free-text description for a link, shown on its stats page and
// on the owner's public link-in-bio page.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("urls", "description", {
      type: Sequelize.STRING(280),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("urls", "description");
  },
};
