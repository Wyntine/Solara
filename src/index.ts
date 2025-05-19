import { checkDatabaseFolder } from "./handlers/database/database.ts";
import { client } from "./utils/client.ts";
import { config } from "./handlers/config.ts";
import { registerEvents } from "./handlers/event.ts";
import { registerLangs } from "./handlers/language.ts";
import { registerCommands } from "./handlers/command.ts";
import {
  commandLogger,
  eventLogger,
  languageLogger,
} from "./handlers/logger.ts";

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
