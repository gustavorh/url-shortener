import { Model, DataTypes } from "sequelize";
import sequelize from "../lib/db";

// One row per BullMQ delivery attempt — kept for auditing and so the UI can
// show users what their endpoints actually received and when something
// failed. We don't store the full payload (it's already in the BullMQ job
// history) to keep the table compact.

export type WebhookDeliveryStatus = "pending" | "success" | "failed";

interface WebhookDeliveryAttributes {
  id: string;
  webhookId: string;
  event: string;
  status: WebhookDeliveryStatus;
  attempts: number;
  // HTTP status code from the latest attempt (null until first response).
  responseStatus: number | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookDeliveryCreationAttributes
  extends Omit<
    WebhookDeliveryAttributes,
    "status" | "attempts" | "responseStatus" | "lastError" | "createdAt" | "updatedAt"
  > {
  status?: WebhookDeliveryStatus;
  attempts?: number;
  responseStatus?: number | null;
  lastError?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class WebhookDelivery
  extends Model<WebhookDeliveryAttributes, WebhookDeliveryCreationAttributes>
  implements WebhookDeliveryAttributes
{
  public id!: string;
  public webhookId!: string;
  public event!: string;
  public status!: WebhookDeliveryStatus;
  public attempts!: number;
  public responseStatus!: number | null;
  public lastError!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

WebhookDelivery.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    webhookId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    event: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: "pending",
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    responseStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lastError: {
      type: DataTypes.STRING(1000),
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
    tableName: "webhook_deliveries",
    timestamps: false,
    indexes: [{ fields: ["webhookId", "createdAt"] }],
  }
);

export default WebhookDelivery;
