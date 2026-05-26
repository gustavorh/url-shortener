"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "locale", {
      type: Sequelize.STRING(2),
      allowNull: false,
      defaultValue: "es",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "locale");
  },
};
