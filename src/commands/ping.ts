import { Command } from "../classes/command.js";
import { CommandConfig } from "../classes/commandConfig.js";
import { CommandType } from "../types/files.types.js";
import { infoEmbed } from "../utils/embeds.js";

const config = new CommandConfig({ type: CommandType.Combined, cooldown: 30 });

export default new Command({
  config,
  async execute({ helpers, language, client }) {
    const botPing = client.ws.ping.toString();
    const pingMessage = language.getText("ping")(botPing);
    await helpers.reply({ embeds: [infoEmbed(pingMessage)] });
  },
});
