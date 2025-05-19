import { Command } from "../classes/command.ts";
import { CommandConfig } from "../classes/commandConfig.ts";
import { CommandType } from "../types/files.types.ts";
import { infoEmbed } from "../utils/embeds.ts";

const config = new CommandConfig({ type: CommandType.Combined, cooldown: 30 });

export default new Command({
  config,
  async execute({ helpers, language, client }) {
    const botPing = client.ws.ping.toString();
    const pingMessage = language.getText("ping")(botPing);
    await helpers.reply({ embeds: [infoEmbed(pingMessage)] });
  },
});
