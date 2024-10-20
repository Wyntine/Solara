import { Command } from "../classes/command.js";
import { CommandType } from "../types/files.types.js";
import { infoEmbed } from "../utils/embeds.js";

export default new Command({
  type: CommandType.Combined,
  slashCommandData: (command) =>
    command.setName("ping").setDescription("Shows ping information."),
  execute: async ({ interaction, language, client }) => {
    const botPing = client.ws.ping.toString();
    const pingMessage = language.getText("ping")(botPing);

    await interaction.reply({
      embeds: [infoEmbed(pingMessage)],
    });
  },
});
