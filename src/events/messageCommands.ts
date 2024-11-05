import { CommandHelper, isCommandExecutable } from "../utils/commands.js";
import { config } from "../handlers/config.js";
import { Event } from "../classes/event.js";
import { getCommand } from "../handlers/command.js";
import { getLanguage } from "../handlers/language.js";
import { userDatabase } from "../handlers/database.js";

export default new Event({
  category: "messageCreate",
  execute: (message) => {
    if (message.author.bot) return;

    const prefix = config.get().commands.defaultPrefix;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = getCommand(commandName);

    if (!command?.enabled) return;

    const isExecutable = isCommandExecutable({
      command,
      interaction: message,
    });

    if (!isExecutable) return;

    const userLanguage = getLanguage(
      userDatabase.get(message.author.id)?.language,
      true,
    );

    const helpers = new CommandHelper({
      command,
      interaction: message,
      language: userLanguage,
      args,
    });

    return command.execute({
      client: message.client,
      interaction: message,
      language: userLanguage,
      command,
      helpers,
    });
  },
});
