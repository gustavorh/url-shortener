import { Model, DataTypes } from "sequelize";
import sequelize from "../lib/db";

// Outbound webhook endpoint owned by a user. Subscribes to a fixed set of
// event types; payloads are signed with the per-webhook secret using
// HMAC-SHA256 (see lib/webhook-signer.ts). Deliveries land in WebhookDelivery
// so failures stay auditable.

interface WebhookAttributes {
  id: string;
  userId: string;
  url: string;
  secret: string;
  // Comma-separated list of event names this webhook subscribes to (e.g.
  // "link.created,link.clicked"). Empty means "all events".
  events: string;
  active: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookCreationAttributes
  extends Omit<
    WebhookAttributes,
    "active" | "description" | "createdAt" | "updatedAt"
  > {
  active?: boolean;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class Webhook
  extends Model<WebhookAttributes, WebhookCreationAttributes>
  implements WebhookAttributes
{
  public id!: string;
  public userId!: string;
  public url!: string;
  public secret!: string;
  public events!: string;
  public active!: boolean;
  public description!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Webhook.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(2048),
      allowNull: false,
    },
    secret: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    events: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "webhooks",
    timestamps: false,
  }
);

export default Webhook;
