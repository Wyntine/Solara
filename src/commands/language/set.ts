import type { Locale } from "discord.js";
import { CommandOptionConfig } from "../../classes/commandOptions.js";
import { Option } from "../../classes/option.js";
import { Subcommand } from "../../classes/subcommand.js";
import { getLanguage, getLanguages } from "../../handlers/language.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { strJoin } from "../../utils/strings.js";
import { userDatabase } from "../../handlers/database.js";

const languageOption = Option.createStringOption({
  required: true,
  choices: getLanguages().map((language) => language.languages.at(0)!),
  maxLength: 3,
  minLength: 2,
});
const options = new CommandOptionConfig(languageOption);

export default new Subcommand({
  options,
  execute({ helpers, language }) {
    const texts = language.getText("language").set;
    const userId = helpers.getUser().id;
    const newLanguage = helpers.getStringOption(languageOption) as
      | Locale
      | undefined;

    if (!newLanguage) {
      return helpers.reply({ embeds: [errorEmbed(".")] });
    }

    const detectedLanguage = getLanguage(newLanguage);

    if (!detectedLanguage) {
      const allLanguages = getLanguages()
        .map((language) => language.languages.at(0)!)
        .join(", ");
      const errorMessage = strJoin([
        texts.error(newLanguage),
        texts.languages(allLanguages),
      ]);

      return helpers.reply({ embeds: [errorEmbed(errorMessage)] });
    }

    const successMessage = detectedLanguage.getText("language").set.success;

    userDatabase.overwrite(userId, { language: newLanguage });
    return helpers.reply({
      embeds: [successEmbed(successMessage(newLanguage))],
    });
  },
});
