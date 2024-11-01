import { Command } from "../classes/command.js";
import { CommandType } from "../types/files.types.js";
import { infoEmbed } from "../utils/embeds.js";

export default new Command({
  type: CommandType.Combined,
  execute: async ({ interaction, language, client }) => {
    const botPing = client.ws.ping.toString();

    const texts = language.getText();
    const pingMessage = texts.ping(botPing);

    await interaction.reply({
      embeds: [infoEmbed(pingMessage)],
    });
  },
});
