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
  public id!: string;
  public userId!: string;
  public type!: NotificationType;
  public payload!: NotificationPayload;
  public readAt?: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
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
