import { Model, DataTypes } from "sequelize";
import sequelize from "../lib/db";

interface ApiKeyAttributes {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  prefix: string;
  lastUsedAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
}

interface ApiKeyCreationAttributes
  extends Omit<
    ApiKeyAttributes,
    "lastUsedAt" | "revokedAt" | "createdAt"
  > {
  lastUsedAt?: Date | null;
  revokedAt?: Date | null;
  createdAt?: Date;
}

class ApiKey
  extends Model<ApiKeyAttributes, ApiKeyCreationAttributes>
  implements ApiKeyAttributes
{
  public id!: string;
  public userId!: string;
  public name!: string;
  public keyHash!: string;
  public prefix!: string;
  public lastUsedAt?: Date | null;
  public revokedAt?: Date | null;
  public createdAt!: Date;
}

ApiKey.init(
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
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    keyHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    prefix: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "api_keys",
    timestamps: false,
  }
);

export default ApiKey;
