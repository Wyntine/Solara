import { DatabaseType, type UserDatabase } from "../types/utils.types.js";
import { Database } from "./database/database.js";

export const userDatabase = new Database<UserDatabase, DatabaseType.YAML>(
  DatabaseType.YAML,
  { filePath: "./databases/users.yml" },
);
