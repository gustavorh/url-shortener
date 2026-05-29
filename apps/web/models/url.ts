import { Model, DataTypes } from 'sequelize';
import sequelize from '../lib/db';

interface UrlAttributes {
  id: string;
  originalUrl: string;
  expirationDate?: Date | null;
  creationDate: Date;
  userId?: string | null;
  title?: string | null;
  tags?: string | null;
  passwordHash?: string | null;
  maxClicks?: number | null;
  disabled?: boolean;
  activeFrom?: Date | null;
  description?: string | null;
  deletedAt?: Date | null;
}

interface UrlCreationAttributes
  extends Omit<
    UrlAttributes,
    | 'creationDate'
    | 'expirationDate'
    | 'userId'
    | 'title'
    | 'tags'
    | 'passwordHash'
    | 'maxClicks'
    | 'disabled'
    | 'activeFrom'
    | 'description'
    | 'deletedAt'
  > {
  expirationDate?: Date | null;
  creationDate?: Date;
  userId?: string | null;
  title?: string | null;
  tags?: string | null;
  passwordHash?: string | null;
  maxClicks?: number | null;
  disabled?: boolean;
  activeFrom?: Date | null;
  description?: string | null;
  deletedAt?: Date | null;
}

class Url extends Model<UrlAttributes, UrlCreationAttributes> implements UrlAttributes {
  // Use `declare` so these stay type-only: a real class field shadows
  // Sequelize's prototype getter/setter and makes instance reads return
  // undefined. See the Sequelize "public class fields" caveat.
  declare id: string;
  declare originalUrl: string;
  declare expirationDate?: Date | null;
  declare creationDate: Date;
  declare userId?: string | null;
  declare title?: string | null;
  declare tags?: string | null;
  declare passwordHash?: string | null;
  declare maxClicks?: number | null;
  declare disabled?: boolean;
  declare activeFrom?: Date | null;
  declare description?: string | null;
  declare deletedAt?: Date | null;
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
    tags: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    maxClicks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    activeFrom: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(280),
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
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