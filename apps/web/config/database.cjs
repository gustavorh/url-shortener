// Database configuration consumed by sequelize-cli (migrations).
// The runtime app uses lib/db.ts instead — both read the same env vars so
// they always point at the same database.

const base = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  host: process.env.DB_HOST || "localhost",
  dialect: "mysql",
};

module.exports = {
  development: {
    ...base,
    database: process.env.DB_NAME || "url_shortener",
  },
  // Integration tests run against an isolated database so they can freely
  // truncate tables without touching development data.
  test: {
    ...base,
    database: process.env.DB_NAME_TEST || "cortala_test",
    logging: false,
  },
  production: {
    ...base,
    database: process.env.DB_NAME || "url_shortener",
    logging: false,
  },
};
