// Central model registry. The database schema is owned by the migrations
// in `migrations/` and applied with `npm run db:migrate` — models are never
// synced at runtime.
import Url from "./url";
import User from "./user";
import Click from "./click";
import ApiKey from "./apikey";
import LinkTarget from "./linktarget";
import Webhook from "./webhook";
import WebhookDelivery from "./webhookdelivery";
import Notification from "./notification";

// Associations. onDelete CASCADE mirrors the foreign keys defined in the
// migrations so behaviour is consistent whether the schema comes from
// migrations or from sequelize.sync() (used by the integration tests).
User.hasMany(Url, { foreignKey: "userId", as: "urls", onDelete: "CASCADE" });
Url.belongsTo(User, { foreignKey: "userId", as: "user" });
Url.hasMany(Click, { foreignKey: "urlId", as: "clicks", onDelete: "CASCADE" });
Click.belongsTo(Url, { foreignKey: "urlId", as: "url" });
User.hasMany(ApiKey, {
  foreignKey: "userId",
  as: "apiKeys",
  onDelete: "CASCADE",
});
ApiKey.belongsTo(User, { foreignKey: "userId", as: "user" });
Url.hasMany(LinkTarget, {
  foreignKey: "urlId",
  as: "targets",
  onDelete: "CASCADE",
});
// alias "link" (not "url") avoids colliding with LinkTarget's own `url` column.
LinkTarget.belongsTo(Url, { foreignKey: "urlId", as: "link" });
User.hasMany(Webhook, {
  foreignKey: "userId",
  as: "webhooks",
  onDelete: "CASCADE",
});
Webhook.belongsTo(User, { foreignKey: "userId", as: "user" });
Webhook.hasMany(WebhookDelivery, {
  foreignKey: "webhookId",
  as: "deliveries",
  onDelete: "CASCADE",
});
WebhookDelivery.belongsTo(Webhook, { foreignKey: "webhookId", as: "webhook" });
User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
  onDelete: "CASCADE",
});
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

const models = {
  Url,
  User,
  Click,
  ApiKey,
  LinkTarget,
  Webhook,
  WebhookDelivery,
  Notification,
};

export {
  Url,
  User,
  Click,
  ApiKey,
  LinkTarget,
  Webhook,
  WebhookDelivery,
  Notification,
};
export default models;
