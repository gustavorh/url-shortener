"use strict";

// Links become owned by users. Nullable so pre-existing anonymous links
// (and anonymous links created before sign-up) remain valid.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("urls", "userId", {
      type: Sequelize.STRING(36),
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    await queryInterface.addIndex("urls", ["userId"], {
      name: "urls_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("urls", "urls_user_id_idx");
    await queryInterface.removeColumn("urls", "userId");
  },
};
