"use strict";

// Audit log of webhook delivery attempts. One row per BullMQ job, updated
// in place by the worker as it retries.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("webhook_deliveries", {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
      },
      webhookId: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: "webhooks", key: "id" },
        onDelete: "CASCADE",
      },
      event: { type: Sequelize.STRING(64), allowNull: false },
      status: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: "pending",
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      responseStatus: { type: Sequelize.INTEGER, allowNull: true },
      lastError: { type: Sequelize.STRING(1000), allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    await queryInterface.addIndex("webhook_deliveries", [
      "webhookId",
      "createdAt",
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("webhook_deliveries");
  },
};
