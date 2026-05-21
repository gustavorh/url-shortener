"use strict";

// Baseline table. Guarded so it is a no-op on databases that predate
// formal migrations (the project previously relied on `model.sync()`).
const tableExists = async (queryInterface, name) => {
  try {
    await queryInterface.describeTable(name);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, "urls")) return;
    await queryInterface.createTable("urls", {
      // STRING(32) from the start so custom aliases are supported.
      id: {
        type: Sequelize.STRING(32),
        primaryKey: true,
        allowNull: false,
      },
      originalUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expirationDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      creationDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("urls");
  },
};
