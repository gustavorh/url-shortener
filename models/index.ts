// Central model registry. The database schema is owned by the migrations
// in `migrations/` and applied with `npm run db:migrate` — models are never
// synced at runtime.
import Url from "./url";
import Log from "./log";
import User from "./user";

// Associations: a user owns many links.
User.hasMany(Url, { foreignKey: "userId", as: "urls" });
Url.belongsTo(User, { foreignKey: "userId", as: "user" });

const models = {
  Url,
  Log,
  User,
};

export { Url, Log, User };
export default models;
