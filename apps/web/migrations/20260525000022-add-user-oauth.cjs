"use strict";

// Adds OAuth fields to the users table so accounts can be created or
// linked via GitHub / Google in addition to email + password.
//
// `passwordHash` becomes nullable because OAuth-only users never set one.
// (provider, providerId) gets a unique index so two different sessions
// from the same external account converge on the same Cortala user.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "provider", {
      type: Sequelize.STRING(32),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "providerId", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "image", {
      type: Sequelize.STRING(2048),
      allowNull: true,
    });
    await queryInterface.changeColumn("users", "passwordHash", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addIndex("users", ["provider", "providerId"], {
      name: "users_provider_provider_id",
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("users", "users_provider_provider_id");
    // We can only flip passwordHash back to NOT NULL safely if every row
    // already has one; pure-OAuth users would block the migration. Down
    // migrations are best-effort, so we leave it nullable.
    await queryInterface.removeColumn("users", "image");
    await queryInterface.removeColumn("users", "providerId");
    await queryInterface.removeColumn("users", "provider");
  },
};
