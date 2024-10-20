import { registerCommands } from "../handlers/command.js";
import { Event } from "../handlers/event.js";
import { systemLogger } from "../handlers/logger.js";

export default new Event({
  category: "ready",
  once: true,
  execute: async (client) => {
    systemLogger.info(`${client.user.username} is ready!`);
    await registerCommands(client);
  },
});
