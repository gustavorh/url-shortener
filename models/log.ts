import { Model, DataTypes } from 'sequelize';
import sequelize from '../lib/db';

interface LogAttributes {
  id: number;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

interface LogCreationAttributes extends Omit<LogAttributes, 'id' | 'timestamp'> {
  timestamp?: Date;
}

class Log extends Model<LogAttributes, LogCreationAttributes> implements LogAttributes {
  public id!: number;
  public method!: string;
  public url!: string;
  public ip!: string;
  public userAgent!: string;
  public timestamp!: Date;
}

Log.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(2048),
      allowNull: false,
    },
    ip: {
      type: DataTypes.STRING(45), // IPv6 can be up to 45 chars
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'request_logs',
    timestamps: false,
  }
);

export default Log; 