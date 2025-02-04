import { checkDatabaseFolder } from "./handlers/database/database.js";
import { client } from "./utils/client.js";
import { config } from "./handlers/config.js";
import { registerEvents } from "./handlers/event.js";
import { registerLangs } from "./handlers/language.js";
import { registerCommands } from "./handlers/command.js";
import {
  commandLogger,
  eventLogger,
  languageLogger,
} from "./handlers/logger.js";

checkDatabaseFolder();

const {
  bot: { token },
} = config.get();

const eventSize = await registerEvents();
eventLogger.info(`${eventSize.toString()} events registered.`);
const langSize = await registerLangs();
languageLogger.info(`${langSize.toString()} languages registered.`);
const commandSize = await registerCommands();
commandLogger.info(`${commandSize.toString()} commands registered.`);

await client.login(token);
