"use strict";

// Free-form tags for organizing links, stored as a normalized
// comma-separated string (parsed/serialized by lib/tags.ts).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("urls", "tags", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("urls", "tags");
  },
};
