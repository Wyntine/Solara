import { Database } from "./database/database.js";
import { DatabaseType, type UserDatabase } from "../types/utils.types.js";

export const userDatabase = new Database<UserDatabase, DatabaseType.YAML>(
  DatabaseType.YAML,
  { filePath: "./databases/users.yml" },
);
