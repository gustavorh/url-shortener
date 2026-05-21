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
  public id!: number;
  public urlId!: string;
  public url!: string;
  public kind!: LinkTargetKind;
  public device?: string | null;
  public createdAt!: Date;
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
