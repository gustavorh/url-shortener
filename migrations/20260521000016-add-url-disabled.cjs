"use strict";

// Lets an owner pause a link without deleting it: a disabled link stops
// resolving but keeps its analytics and can be re-enabled.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("urls", "disabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("urls", "disabled");
  },
};
