// Central model registry. The database schema is owned by the migrations
// in `migrations/` and applied with `npm run db:migrate` — models are never
// synced at runtime.
import Url from "./url";
import User from "./user";
import Click from "./click";

// Associations. onDelete CASCADE mirrors the foreign keys defined in the
// migrations so behaviour is consistent whether the schema comes from
// migrations or from sequelize.sync() (used by the integration tests).
User.hasMany(Url, { foreignKey: "userId", as: "urls", onDelete: "CASCADE" });
Url.belongsTo(User, { foreignKey: "userId", as: "user" });
Url.hasMany(Click, { foreignKey: "urlId", as: "clicks", onDelete: "CASCADE" });
Click.belongsTo(Url, { foreignKey: "urlId", as: "url" });

const models = {
  Url,
  User,
  Click,
};

export { Url, User, Click };
export default models;
