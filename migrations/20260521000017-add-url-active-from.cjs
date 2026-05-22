"use strict";

// Optional scheduled activation: a link does not resolve before activeFrom.
// Null means the link is active immediately.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("urls", "activeFrom", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("urls", "activeFrom");
  },
};
