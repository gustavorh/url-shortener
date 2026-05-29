import { Model, DataTypes } from "sequelize";
import sequelize from "../lib/db";

interface ClickAttributes {
  id: number;
  urlId: string;
  timestamp: Date;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  referrerDomain?: string | null;
  country?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
  targetUrl?: string | null;
}

interface ClickCreationAttributes
  extends Omit<ClickAttributes, "id" | "timestamp"> {
  timestamp?: Date;
}

class Click
  extends Model<ClickAttributes, ClickCreationAttributes>
  implements ClickAttributes
{
  // `declare` keeps these type-only; a real class field would shadow
  // Sequelize's prototype getter/setter (instance reads return undefined).
  declare id: number;
  declare urlId: string;
  declare timestamp: Date;
  declare ip?: string | null;
  declare userAgent?: string | null;
  declare referrer?: string | null;
  declare referrerDomain?: string | null;
  declare country?: string | null;
  declare deviceType?: string | null;
  declare browser?: string | null;
  declare os?: string | null;
  declare targetUrl?: string | null;
}

Click.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    urlId: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ip: { type: DataTypes.STRING(45), allowNull: true },
    userAgent: { type: DataTypes.TEXT, allowNull: true },
    referrer: { type: DataTypes.STRING(2048), allowNull: true },
    referrerDomain: { type: DataTypes.STRING(255), allowNull: true },
    country: { type: DataTypes.STRING(2), allowNull: true },
    deviceType: { type: DataTypes.STRING(20), allowNull: true },
    browser: { type: DataTypes.STRING(50), allowNull: true },
    os: { type: DataTypes.STRING(50), allowNull: true },
    targetUrl: { type: DataTypes.STRING(2048), allowNull: true },
  },
  {
    sequelize,
    tableName: "clicks",
    timestamps: false,
  }
);

export default Click;
