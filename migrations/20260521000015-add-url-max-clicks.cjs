"use strict";

// Optional click limit: once a link reaches maxClicks visits it stops
// resolving. Null means unlimited.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("urls", "maxClicks", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("urls", "maxClicks");
  },
};
