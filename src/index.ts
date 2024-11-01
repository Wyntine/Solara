import { client } from "./utils/client.js";
import { config } from "./handlers/config.js";
import { checkDatabaseFolder } from "./handlers/database/database.js";

import { registerEvents } from "./handlers/event.js";
import { registerLangs } from "./handlers/language.js";

checkDatabaseFolder();

const {
  bot: { token },
} = config.get();

await registerEvents();
await registerLangs();

await client.login(token);
