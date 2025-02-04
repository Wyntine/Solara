import { Event } from "../classes/event.js";
import { registerSlashCommands } from "../handlers/command.js";
import { systemLogger } from "../handlers/logger.js";

export default new Event({
  category: "ready",
  once: true,
  execute: async (client) => {
    await registerSlashCommands(client);
    systemLogger.info(`${client.user.username} is ready!`);
  },
});
