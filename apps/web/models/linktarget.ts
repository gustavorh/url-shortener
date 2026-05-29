import { Model, DataTypes } from "sequelize";
import sequelize from "../lib/db";

export type LinkTargetKind = "device" | "rotation";

interface LinkTargetAttributes {
  id: number;
  urlId: string;
  url: string;
  kind: LinkTargetKind;
  device?: string | null;
  createdAt: Date;
}

interface LinkTargetCreationAttributes
  extends Omit<LinkTargetAttributes, "id" | "device" | "createdAt"> {
  device?: string | null;
  createdAt?: Date;
}

class LinkTarget
  extends Model<LinkTargetAttributes, LinkTargetCreationAttributes>
  implements LinkTargetAttributes
{
  // `declare` keeps these type-only; a real class field would shadow
  // Sequelize's prototype getter/setter (instance reads return undefined).
  declare id: number;
  declare urlId: string;
  declare url: string;
  declare kind: LinkTargetKind;
  declare device?: string | null;
  declare createdAt: Date;
}

LinkTarget.init(
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
    url: {
      type: DataTypes.STRING(2048),
      allowNull: false,
    },
    kind: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    device: {
      type: DataTypes.STRING(16),
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
    tableName: "link_targets",
    timestamps: false,
  }
);

export default LinkTarget;
