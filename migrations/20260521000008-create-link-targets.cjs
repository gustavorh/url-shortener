"use strict";

// Alternative destinations for a link. A link can route by device
// (kind='device') or split traffic across variants (kind='rotation').
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("link_targets", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      urlId: {
        type: Sequelize.STRING(32),
        allowNull: false,
        references: { model: "urls", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      url: {
        type: Sequelize.STRING(2048),
        allowNull: false,
      },
      // 'device' → routes by visitor device; 'rotation' → A/B variant.
      kind: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      // For kind='device': 'ios' | 'android' | 'desktop'.
      device: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    await queryInterface.addIndex("link_targets", ["urlId"], {
      name: "link_targets_url_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("link_targets");
  },
};
