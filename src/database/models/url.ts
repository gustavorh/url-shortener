import { DataTypes } from "sequelize";
import { sequelize } from "@/database/db";

export const Url = sequelize.define(
  "urls",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },

    url: {
      type: DataTypes.STRING,
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Date.now,
    },
  },
  { timestamps: false }
);

sequelize.sync({ alter: true });
