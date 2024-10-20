// import { PermissionFlagsBits } from "discord.js";
import { Command } from "../classes/command.js";
import { CommandType } from "../types/files.types.js";
import { errorEmbed } from "../utils/embeds.js";

export default new Command({
  type: CommandType.Combined,
  slashCommandData: (command) =>
    command
      .setName("text")
      .setDescription("Prints what you write.")
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("The message to print.")
          .setRequired(true)
          .setMinLength(1),
      ),
  execute: ({ helpers }) => {
    const content = helpers.getStringOption("message");

    if (!content) {
      return helpers.reply({
        embeds: [errorEmbed("Please provide a message.")],
      });
    }

    return helpers.reply({ content });
  },
});
