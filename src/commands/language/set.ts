import { CommandOptionConfig } from "../../classes/commandOptions.js";
import { Option } from "../../classes/option.js";
import { Subcommand } from "../../classes/subcommand.js";
import { getLanguageByCode, getLanguages } from "../../handlers/language.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { strJoin } from "../../utils/strings.js";
import { userDatabase } from "../../handlers/database.js";

const languageOption = Option.createStringOption({
  required: true,
  choices: getLanguages().map((language) => ({
    name: language.name,
    value: language.code,
  })),
  maxLength: 3,
  minLength: 2,
});

const options = new CommandOptionConfig(languageOption);

export default new Subcommand({
  options,
  execute({ helpers, language }) {
    const texts = language.getText("language").set;
    const userId = helpers.getUser().id;
    const newLanguage = helpers.getStringOption(languageOption);

    if (!newLanguage) {
      return helpers.reply({ embeds: [errorEmbed(texts.noInput)] });
    }

    const detectedLanguage = getLanguageByCode(newLanguage);

    if (!detectedLanguage) {
      const allLanguages = getLanguages()
        .map((language) => language.code)
        .join(", ");
      const errorMessage = strJoin([
        texts.error,
        texts.languages(allLanguages),
      ]);

      return helpers.reply({ embeds: [errorEmbed(errorMessage)] });
    }

    const successMessage = detectedLanguage.getText("language").set.success;

    userDatabase.overwrite(userId, { language: newLanguage });
    return helpers.reply({
      embeds: [successEmbed(successMessage(detectedLanguage.name))],
    });
  },
});
