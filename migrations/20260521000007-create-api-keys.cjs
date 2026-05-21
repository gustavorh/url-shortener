"use strict";

// API keys for the public REST API. Only the SHA-256 hash of each key is
// stored; the plaintext key is shown to the user once at creation time.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("api_keys", {
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
        onUpdate: "CASCADE",
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      keyHash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      // Non-secret leading fragment, shown in the UI to identify a key.
      prefix: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      lastUsedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      revokedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    await queryInterface.addIndex("api_keys", ["userId"], {
      name: "api_keys_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("api_keys");
  },
};
