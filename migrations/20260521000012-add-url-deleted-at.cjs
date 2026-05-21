"use strict";

// Soft delete for links: a deleted link stops resolving and disappears from
// the owner's views, but the row (and its analytics) is retained.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("urls", "deletedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("urls", "deletedAt");
  },
};
