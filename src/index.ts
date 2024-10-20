import { client } from "./utils/client.js";
import { config } from "./handlers/config.js";
import { Event } from "./handlers/event.js";
import { registerLangs } from "./handlers/language.js";
import { checkDatabaseFolder } from "./handlers/database/database.js";

checkDatabaseFolder();

const {
  bot: { token },
} = config.get();

await Event.registerEvents();
await registerLangs();
await client.login(token);
