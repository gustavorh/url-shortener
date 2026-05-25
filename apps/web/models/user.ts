import { Model, DataTypes } from "sequelize";
import sequelize from "../lib/db";

export type AuthProvider = "github" | "google";

interface UserAttributes {
  id: string;
  email: string;
  // Null for OAuth-only users — they never set a local password.
  passwordHash: string | null;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  // OAuth identity. Both fields are null for Credentials-only accounts.
  provider?: AuthProvider | null;
  providerId?: string | null;
  // Avatar URL from the OAuth provider, if any.
  image?: string | null;
  createdAt: Date;
}

interface UserCreationAttributes
  extends Omit<
    UserAttributes,
    | "createdAt"
    | "name"
    | "username"
    | "bio"
    | "passwordHash"
    | "provider"
    | "providerId"
    | "image"
  > {
  passwordHash?: string | null;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  provider?: AuthProvider | null;
  providerId?: string | null;
  image?: string | null;
  createdAt?: Date;
}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public email!: string;
  public passwordHash!: string | null;
  public name?: string | null;
  public username?: string | null;
  public bio?: string | null;
  public provider?: AuthProvider | null;
  public providerId?: string | null;
  public image?: string | null;
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
      allowNull: true,
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
    provider: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    providerId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(2048),
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
    indexes: [
      {
        name: "users_provider_provider_id",
        unique: true,
        fields: ["provider", "providerId"],
      },
    ],
  }
);

export default User;
