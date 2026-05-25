"use strict";

// Optional password protection for links. Only the bcrypt hash is stored;
// links without a password keep this column null.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("urls", "passwordHash", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("urls", "passwordHash");
  },
};
