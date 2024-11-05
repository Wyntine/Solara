import { CommandHelper, isCommandExecutable } from "../utils/commands.js";
import { Event } from "../classes/event.js";
import { getCommand } from "../handlers/command.js";
import { getLanguage } from "../handlers/language.js";
import { userDatabase } from "../handlers/database.js";

export default new Event({
  category: "interactionCreate",
  execute: (interaction) => {
    if (interaction.user.bot || !interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName;

    if (!commandName) return;

    const command = getCommand(commandName);

    if (!command?.enabled) return;

    const isExecutable = isCommandExecutable({
      command,
      interaction: interaction,
    });

    if (!isExecutable) return;

    const userLanguage = getLanguage(
      userDatabase.get(interaction.user.id)?.language ?? interaction.locale,
      true,
    );
    const helpers = new CommandHelper({
      command,
      interaction,
      language: userLanguage,
    });

    return command.execute({
      client: interaction.client,
      language: userLanguage,
      interaction,
      command,
      helpers,
    });
  },
});
