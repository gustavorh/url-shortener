"use strict";

// Legacy generic request log. Kept as historical data; the app no longer
// writes to it (per-link analytics live in the `clicks` table).
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
    if (await tableExists(queryInterface, "request_logs")) return;
    await queryInterface.createTable("request_logs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      method: { type: Sequelize.STRING(10), allowNull: false },
      url: { type: Sequelize.STRING(2048), allowNull: false },
      ip: { type: Sequelize.STRING(45), allowNull: false },
      userAgent: { type: Sequelize.TEXT, allowNull: false },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("request_logs");
  },
};
