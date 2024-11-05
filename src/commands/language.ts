import { Command } from "../classes/command.js";
import { CommandType } from "../types/files.types.js";
import { errorEmbed, infoEmbed, successEmbed } from "../utils/embeds.js";
import { getLanguage, getLanguages } from "../handlers/language.js";
import { removeKey } from "../utils/objects.js";
import { strJoin } from "../utils/strings.js";
import { userDatabase } from "../handlers/database.js";
import type { Locale } from "discord.js";

// TODO: Complete the language support
export default new Command({
  type: CommandType.Combined,
  slashCommandData: (command) => command.addStringOption((option) => option),
  execute: ({ helpers, language }) => {
    const newLanguage = helpers.getStringOption("new-lang") as
      | Locale
      | "clear"
      | undefined;
    const userId = helpers.getUser().id;

    if (!newLanguage) {
      const userLanguage =
        userDatabase.get(userId)?.language ?? "(Not defined)";

      const infoMessage = strJoin([
        `Display language: **${language.languages.at(0)!}**`,
        `User language: **${userLanguage}**`,
      ]);

      return helpers.reply({ embeds: [infoEmbed(infoMessage)] });
    }

    if (newLanguage === "clear") {
      userDatabase.set(userId, (data) =>
        data ? removeKey(data, "language") : data,
      );

      return helpers.reply({ embeds: [successEmbed("Language cleared")] });
    }

    const detectedLanguage = getLanguage(newLanguage);

    if (!detectedLanguage) {
      const allLanguages = getLanguages()
        .map((language) => language.languages.at(0)!)
        .join(", ");
      const errorMessage = strJoin([
        `Language **${newLanguage}** not found.`,
        `Available languages: ${allLanguages}`,
      ]);

      return helpers.reply({ embeds: [errorEmbed(errorMessage)] });
    }

    userDatabase.overwrite(userId, { language: newLanguage });
    return helpers.reply({
      embeds: [successEmbed(`Your language is set to **${newLanguage}**`)],
    });
  },
});
