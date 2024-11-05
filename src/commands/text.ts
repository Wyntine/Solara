import { Command } from "../classes/command.js";
import { CommandType } from "../types/files.types.js";
import { errorEmbed } from "../utils/embeds.js";
// import { PermissionFlagsBits } from "discord.js";

export default new Command({
  type: CommandType.Combined,
  slashCommandData: (command) =>
    command.addStringOption((option) =>
      option.setRequired(true).setMinLength(1),
    ),
  execute: ({ helpers }) => {
    const content = helpers.getStringOption("mesaj");

    if (!content) {
      return helpers.reply({
        embeds: [errorEmbed("Please provide a message.")],
      });
    }

    return helpers.reply({ content });
  },
});
