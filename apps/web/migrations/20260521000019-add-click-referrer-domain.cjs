"use strict";

// Stores the referrer's bare domain alongside the full referrer URL, for
// cleaner "top sources" analytics.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("clicks", "referrerDomain", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("clicks", "referrerDomain");
  },
};
