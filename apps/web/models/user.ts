import { Model, DataTypes } from "sequelize";
import sequelize from "../lib/db";

export type AuthProvider = "github" | "google";
export type UserLocale = "es" | "en";

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
  locale: UserLocale;
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
    | "locale"
  > {
  passwordHash?: string | null;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  provider?: AuthProvider | null;
  providerId?: string | null;
  image?: string | null;
  locale?: UserLocale;
  createdAt?: Date;
}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  // `declare` (not `public x!: T`) is required: a real class field emits an
  // own property that shadows Sequelize's prototype getter/setter, so reads
  // like `user.passwordHash` return undefined. See the "caveat with public
  // class fields" note in the Sequelize docs.
  declare id: string;
  declare email: string;
  declare passwordHash: string | null;
  declare name?: string | null;
  declare username?: string | null;
  declare bio?: string | null;
  declare provider?: AuthProvider | null;
  declare providerId?: string | null;
  declare image?: string | null;
  declare locale: UserLocale;
  declare createdAt: Date;
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
    locale: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: "es",
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
