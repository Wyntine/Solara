import { Logger } from "../utils/logger.js";

export const systemLogger = new Logger("System");
export const commandLogger = new Logger("Command");
export const eventLogger = new Logger("Event");
export const configLogger = new Logger("Config");
export const languageLogger = new Logger("Language");
export const databaseLogger = new Logger("Database");
