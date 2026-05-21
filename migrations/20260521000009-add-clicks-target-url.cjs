"use strict";

// Records which destination was actually served for a click, so A/B
// variants and device routes can be compared in analytics.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("clicks", "targetUrl", {
      type: Sequelize.STRING(2048),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("clicks", "targetUrl");
  },
};
