"use strict";

// Outbound webhooks: subscribers receive HMAC-signed POSTs for events such
// as link.created, link.clicked, link.expired and link.limit_reached.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("webhooks", {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      url: { type: Sequelize.STRING(2048), allowNull: false },
      secret: { type: Sequelize.STRING(64), allowNull: false },
      events: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: "",
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      description: { type: Sequelize.STRING(255), allowNull: true },
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
    await queryInterface.addIndex("webhooks", ["userId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("webhooks");
  },
};
