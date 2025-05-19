import { Event } from "../classes/event.ts";
import { registerSlashCommands } from "../handlers/command.ts";
import { systemLogger } from "../handlers/logger.ts";

export default new Event({
  category: "ready",
  once: true,
  execute: async (client) => {
    await registerSlashCommands(client);
    systemLogger.info(`${client.user.username} is ready!`);
  },
});
