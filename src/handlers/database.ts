import { Database } from "./database/database.ts";
import {
  DatabaseType,
  type CooldownDatabase,
  type UserDatabase,
} from "../types/utils.types.ts";

export const userDatabase = new Database<UserDatabase, DatabaseType.YAML>(
  DatabaseType.YAML,
  { filePath: "./databases/users.yml" },
);

export const cooldowns = new Database<CooldownDatabase, DatabaseType.YAML>(
  DatabaseType.YAML,
  { filePath: "./databases/cooldowns.yml" },
);

export const commandExecutionMap = new Map<string, string[]>();
