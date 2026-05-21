"use strict";

// On databases created before formal migrations, `urls.id` is VARCHAR(5).
// Widen it to VARCHAR(32) so custom aliases fit. Widening a VARCHAR primary
// key is a safe, non-destructive ALTER in MySQL. No-op when already 32.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("urls", "id", {
      type: Sequelize.STRING(32),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("urls", "id", {
      type: Sequelize.STRING(5),
      allowNull: false,
    });
  },
};
