"use strict";

// Per-link click events — the foundation of the analytics dashboard.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("clicks", {
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
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      ip: { type: Sequelize.STRING(45), allowNull: true },
      userAgent: { type: Sequelize.TEXT, allowNull: true },
      referrer: { type: Sequelize.STRING(2048), allowNull: true },
      // Populated in a later phase via geo-IP enrichment.
      country: { type: Sequelize.STRING(2), allowNull: true },
      deviceType: { type: Sequelize.STRING(20), allowNull: true },
      browser: { type: Sequelize.STRING(50), allowNull: true },
      os: { type: Sequelize.STRING(50), allowNull: true },
    });
    // Composite index powers the per-link time-series queries.
    await queryInterface.addIndex("clicks", ["urlId", "timestamp"], {
      name: "clicks_url_id_timestamp_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("clicks");
  },
};
