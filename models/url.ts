import { Model, DataTypes } from 'sequelize';
import sequelize from '../lib/db';

interface UrlAttributes {
  id: string;
  originalUrl: string;
  expirationDate?: Date;
  creationDate: Date;
}

interface UrlCreationAttributes extends Omit<UrlAttributes, 'creationDate'> {
  creationDate?: Date;
}

class Url extends Model<UrlAttributes, UrlCreationAttributes> implements UrlAttributes {
  public id!: string;
  public originalUrl!: string;
  public expirationDate?: Date;
  public creationDate!: Date;
}

Url.init(
  {
    id: {
      type: DataTypes.STRING(5),
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
  },
  {
    sequelize,
    tableName: 'urls',
    timestamps: false,
  }
);

export default Url; 