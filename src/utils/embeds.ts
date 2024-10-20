import { Colors, EmbedBuilder } from "discord.js";

export function errorEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setDescription(description).setColor(Colors.Red);
}

export function successEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setDescription(description).setColor(Colors.Green);
}

export function warningEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setDescription(description).setColor(Colors.Gold);
}

export function infoEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setDescription(description).setColor(Colors.Blue);
}
