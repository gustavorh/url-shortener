import { Model, DataTypes } from "sequelize";
import sequelize from "../lib/db";

// Notification types. Kept in sync with packages/schemas-style zod enum in
// lib/schemas/notifications.ts.
export type NotificationType =
  | "link.expiring_soon"
  | "link.limit_reached"
  | "link.expired"
  | "weekly.digest";

export type NotificationPayload = Record<string, unknown>;

interface NotificationAttributes {
  id: string;
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationCreationAttributes
  extends Omit<NotificationAttributes, "readAt" | "createdAt" | "updatedAt"> {
  readAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  // `declare` keeps these type-only; a real class field would shadow
  // Sequelize's prototype getter/setter (instance reads return undefined).
  declare id: string;
  declare userId: string;
  declare type: NotificationType;
  declare payload: NotificationPayload;
  declare readAt?: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Notification.init(
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
    type: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    readAt: {
      type: DataTypes.DATE,
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
    tableName: "notifications",
    timestamps: true,
  }
);

export default Notification;
