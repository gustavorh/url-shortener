import { Model, DataTypes } from 'sequelize';
import sequelize from '../lib/db';

interface UrlAttributes {
  id: string;
  originalUrl: string;
  expirationDate?: Date | null;
  creationDate: Date;
  userId?: string | null;
  title?: string | null;
}

interface UrlCreationAttributes
  extends Omit<
    UrlAttributes,
    'creationDate' | 'expirationDate' | 'userId' | 'title'
  > {
  expirationDate?: Date | null;
  creationDate?: Date;
  userId?: string | null;
  title?: string | null;
}

class Url extends Model<UrlAttributes, UrlCreationAttributes> implements UrlAttributes {
  public id!: string;
  public originalUrl!: string;
  public expirationDate?: Date | null;
  public creationDate!: Date;
  public userId?: string | null;
  public title?: string | null;
}

Url.init(
  {
    id: {
      type: DataTypes.STRING(32),
      primaryKey: true,
      allowNull: false,
    },
    originalUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    creationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'urls',
    timestamps: false,
  }
);

export default Url; 