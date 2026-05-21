import { Model, DataTypes } from "sequelize";
import sequelize from "../lib/db";

interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  createdAt: Date;
}

interface UserCreationAttributes
  extends Omit<
    UserAttributes,
    "createdAt" | "name" | "username" | "bio"
  > {
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  createdAt?: Date;
}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public name?: string | null;
  public username?: string | null;
  public bio?: string | null;
  public createdAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING(32),
      allowNull: true,
      unique: true,
    },
    bio: {
      type: DataTypes.TEXT,
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
    tableName: "users",
    timestamps: false,
  }
);

export default User;
